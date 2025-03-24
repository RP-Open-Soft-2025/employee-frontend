import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  activeChatId: string | null;
  chatStatus: string | null;
  messages: any[]; // Using any[] for simplicity
}

const initialState: ChatState = {
  activeChatId: null,
  chatStatus: null,
  messages: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChatId: (state, action: PayloadAction<string | null>) => {
      console.log("Setting activeChatId in Redux:", action.payload);
      state.activeChatId = action.payload;
    },
    setChatStatus: (state, action: PayloadAction<string | null>) => {
      state.chatStatus = action.payload;
    },
    addMessage: (state, action: PayloadAction<any>) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action: PayloadAction<any[]>) => {
      state.messages = action.payload;
    },
    clearChat: (state) => {
      console.log("Clearing chat state in Redux");
      state.activeChatId = null;
      state.chatStatus = null;
      state.messages = [];
    },
  },
});

export const { 
  setActiveChatId, 
  setChatStatus, 
  addMessage, 
  setMessages, 
  clearChat 
} = chatSlice.actions;

export default chatSlice.reducer; 