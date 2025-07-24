"use client"

interface ButtonProps{
    textColor?: string;
    bgColor? : string; 
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({textColor = "text-white",bgColor = "bg-blue-500",children,onClick}:ButtonProps) =>{
    return (
            <button className={`${textColor} ${bgColor} px-4 py-2 rounded cursor-pointer`} onClick={onClick}>
                {children}
            </button>
    );
}