"use client"

import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                FileGen
                            </h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Your complete file management solution. Upload, organize, share, and collaborate with powerful tools designed for modern workflows.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="p-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg transition-colors">
                                <Facebook size={20} className="text-blue-400" />
                            </a>
                            <a href="#" className="p-2 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors">
                                <Instagram size={20} className="text-purple-400" />
                            </a>
                            <a href="#" className="p-2 bg-blue-400/20 hover:bg-blue-400/40 rounded-lg transition-colors">
                                <Twitter size={20} className="text-blue-300" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Quick Links</h4>
                        <div className="space-y-2">
                            <Link href="/" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Home
                            </Link>
                            <Link href="/about" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                About Us
                            </Link>
                            <Link href="/contact" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Contact
                            </Link>
                            <Link href="/dashboard" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Support</h4>
                        <div className="space-y-2">
                            <Link href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Help Center
                            </Link>
                            <Link href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                Terms of Service
                            </Link>
                            <Link href="#" className="block text-gray-300 hover:text-white transition-colors text-sm">
                                FAQ
                            </Link>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Contact Info</h4>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <Mail size={16} className="text-blue-400" />
                                <span>support@filegen.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <Phone size={16} className="text-green-400" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <MapPin size={16} className="text-red-400" />
                                <span>123 Tech Street, Innovation City</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-700/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-gray-400 text-sm">
                            © 2025 FileGen. All rights reserved.
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <Link href="#" className="hover:text-white transition-colors">
                                Privacy
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                Terms
                            </Link>
                            <Link href="#" className="hover:text-white transition-colors">
                                Cookies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;