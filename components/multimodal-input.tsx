'use client';

import type { Message } from 'ai';
import cx from 'classnames';
import type React from 'react';
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
  memo,
} from 'react';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon } from './icons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import type { UseChatHelpers, } from '@ai-sdk/react';
import { Mic, MicOff } from 'lucide-react';

// TypeScript definitions for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Add to global window object
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

// Wake word configuration
const WAKE_WORD = 'assistant';

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  messages,
  setMessages,
  append,
  handleSubmit,
  className,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  messages: Array<Message>;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '98px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      setInput(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    handleSubmit();
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    handleSubmit,
    setLocalStorageInput,
    width,
  ]);

  // Set up speech recognition
  useEffect(() => {
    // Check if speech recognition is available in the browser
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    // Create recognition instance
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    
    const recognition = new SpeechRecognitionAPI();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    // Process speech results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      
      // Combine all results to get full transcript
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      // Check for wake word
      const lowercaseTranscript = transcript.toLowerCase();
      if (lowercaseTranscript.includes(WAKE_WORD)) {
        const commandIndex = lowercaseTranscript.lastIndexOf(WAKE_WORD) + WAKE_WORD.length;
        const command = transcript.slice(commandIndex).trim();
        
        if (command) {
          // Play feedback sound (optional)
          try {
            new Audio('/sounds/wake-word.mp3').play()
              .catch(() => console.log('Could not play sound'));
          } catch (error) {
            // Ignore sound errors
          }
          
          // Set and send the command
          setInput(command);
          toast.success(`Sending: "${command}"`);
          
          setTimeout(() => {
            if (status === 'ready') {
              handleSubmit();
              setInput('');
              resetHeight();
            }
          }, 300);
        }
      } else {
        // Just update the input field with transcript
        setInput(transcript);
        adjustHeight();
      }
    };
    
    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    // Auto-restart when recognition ends
    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
          setIsListening(false);
        }
      }
    };
    
    // Store the recognition instance
    recognitionRef.current = recognition;
    
    // Clean up on unmount
    return () => {
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('Error stopping recognition:', error);
        }
      }
    };
  }, [handleSubmit, isListening, setInput, status]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }
    
    if (isListening) {
      // Stop listening
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        toast.info('Voice input disabled');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    } else {
      // Start listening
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success(`Voice input enabled. Say "${WAKE_WORD}" followed by your message.`);
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  }, [isListening]);

  // Keyboard shortcut (Alt+M) to toggle voice input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleListening]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <Textarea
        data-testid="multimodal-input"
        ref={textareaRef}
        placeholder={isListening 
          ? `Listening... Say "${WAKE_WORD}" followed by your message` 
          : "Send a message or press Alt+M for voice input"}
        value={input}
        onChange={handleInput}
        className={cx(
          'min-h-[24px] max-h-[calc(20dvh)] overflow-y-scroll [scrollbar-width:_none] resize-none rounded-2xl !text-base bg-white text-gray-800 dark:text-white dark:bg-[hsl(var(--deep-blue-darker))] border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] focus:ring-2 focus:ring-[#2563eb] dark:focus:ring-[#3b82f6] focus:ring-opacity-50 focus:border-[#2563eb] dark:focus:border-[#3b82f6] focus:outline-none',
          isListening && 'border-green-500 dark:border-green-500',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();

            if (status !== 'ready') {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end items-center gap-2">
        <Button
          className={`rounded-full p-1.5 h-fit border ${isListening 
            ? 'border-green-500 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 animate-pulse' 
            : 'border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] bg-white dark:bg-[hsl(var(--deep-blue-darker))] text-gray-700 dark:text-white'}`}
          onClick={toggleListening}
          title={isListening ? "Disable voice input (Alt+M)" : "Enable voice input (Alt+M)"}
        >
          {isListening ? <Mic size={14} /> : <MicOff size={14} />}
        </Button>
        <SendButton
          input={input}
          submitForm={submitForm}
        />
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    if (prevProps.status !== nextProps.status) return false;

    return true;
  },
);

function PureSendButton({
  submitForm,
  input,
}: {
  submitForm: () => void;
  input: string;
}) {
  return (
    <Button
      data-testid="send-button"
      className="rounded-full p-1.5 h-fit border border-gray-200 dark:border-[hsl(var(--deep-blue-dark))] bg-white dark:bg-[hsl(var(--deep-blue-darker))] text-[#2563eb] dark:text-white"
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0}
    >
      <ArrowUpIcon size={14} />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
