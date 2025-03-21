import Image from "next/image";

export default function Home() {
  return (
    <div className="w-screen h-[100vh] md:min-h-screen flex flex-col md:flex-row">
       {/* Left Section (Green) */}
       <div className="h-[50vh] md:h-auto w-full md:w-1/2  flex items-center justify-center bg-[#66872B] relative ">
       <div className="rounded-none md:rounded-tl-2xl md:rounded-bl-2xl  rounded-tl-0xl w-full h-full md:w-[350px] md:h-[350px] bg-[#3B4F17] shadow-lg flex flex-col items-center justify-center text-center p-6 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 py-15">
         <h1 className="text-2xl font-bold text-white">Deloitte.</h1>
         <Image
           src="/logo.png"
           alt="Centered Image"
           width={150}
           height={150}
           className="rounded-lg shadow-[0_0_70px_25px_rgba(255,255,255,0.2)]"
         />
       </div>
     </div>
     
     
 
 
       {/* Right Section (Gray) */}
       <div className="h-[50vh] md:h-auto w-full md:w-1/2  flex items-center justify-center bg-gray-200 relative">
       <div className="rounded-tr-2xl rounded-br-2xl  w-full h-[50vh] md:h-1/2 md:w-[350px] md:h-[350px] bg-[#D9D9D9] shadow-lg  p-6 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2" >
       <div className=" gap-y-3 flex flex-col items-center justify-center mt-[2vh] md: mt-0">
       <div className="text-black font-semibold text-[2rem]"> Login </div>
         <input
           placeholder="Employee ID"
           className="w-4/5 sm:w-4/5 h-10 p-3 border border-gray-300 bg-white rounded-lg text-gray-600"
         />
         <input
           type="password"
           placeholder="password"
           className="w-4/5 sm:w-4/5 h-10 p-3 border border-gray-300 bg-white rounded-lg text-gray-600"
         />
         <button className="w-40 h-12 bg-[#7CB153] text-white font-bold rounded-sm shadow-md hover:bg-[#7CB130] transition p-2">
           Submit
         </button>
         <u className="text-blue-500 underline cursor-pointer">Forgot password</u>
       </div>
         
       </div>
     </div>
     
 
    </div>
  );
}
