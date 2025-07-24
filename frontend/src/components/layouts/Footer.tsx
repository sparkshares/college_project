"use client"

import { Facebook, Instagram } from "lucide-react";



const Footer = () => {
    return (
        <div className="bg-blue-200 text-black p-8 ">
            <div className="lg:flex flex-row grid justify-between items-center">
                    <div>
                        <p className="mx-6 text-2xl">Filegen</p>
                    </div>
                
                    <div className="lg:flex mt-5 grid gap-5 mx-7">
                        <p>Contact Us</p>
                        <p>About us</p>
                        <p>Privacy Policy</p>
                    </div>
            </div>

            <hr className="mt-5" />

            <div className="lg:flex grid lg:flex-row justify-between items-center mt-5 mx-4">
                <div className="flex gap-5">
                    <p className="p-3 bg-white rounded-md"><Facebook /></p> 
                    <p className="p-3 bg-white rounded-md"><Instagram /></p>
                </div>
                <p className="mt-2">
                    Copyright &copy; Filegen 2025, All right reserved !
                </p>
            </div>
        </div>

    );
}

export default Footer;