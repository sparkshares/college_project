"use client";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronDown, Search, Bell } from "lucide-react";
import type { RootState, AppDispatch } from "@/store/store";

const DashboardNavbar = ()=> {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { access, profile } = useSelector((state: RootState) => state.auth);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debug: Log the profile data
    useEffect(() => {
        console.log('Profile data in navbar:', profile);
    }, [profile]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await dispatch(logout());
        if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
        }
        router.push("/");
    };

    const getInitials = (fullName: string | null | undefined) => {
        if (!fullName || typeof fullName !== 'string') return 'U';
        return fullName
            .split(' ')
            .map(name => name.charAt(0))
            .join('')
            .toUpperCase();
    };

    return (
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
            <div className="max-w-8xl px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <Image 
                                src="/dllogo.jpg" 
                                alt="FileGen Logo" 
                                width={120}
                                height={40}
                                className="h-10 w-auto"
                            />
                        </Link>
                       
                    </div>

                    {/* Center - Search Bar */}
                    {/* <div className="flex-1 max-w-md mx-8 hidden md:block">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search files, documents..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                            />
                        </div>
                    </div> */}

                    {/* Right Side - Notifications & Profile */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications
                        <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
                        </button> */}

                        {/* Profile Dropdown */}
                        {access && profile && (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                >
                                    {/* Profile Avatar */}
                                    <div className="w-9 h-9 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                                        {getInitials(profile?.full_name)}
                                    </div>
                                    
                                    {/* User Name - Hidden on mobile */}
                                    <div className="hidden md:block text-left">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {profile?.full_name || 'User'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {profile?.bio || 'User account'}
                                        </div>
                                    </div>
                                    
                                    {/* Dropdown Arrow */}
                                    <ChevronDown 
                                        size={16} 
                                        className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-30 animate-in fade-in-0 zoom-in-95">
                                        {/* Profile Info */}
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                                                    {getInitials(profile?.full_name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">
                                                        {profile?.full_name || 'User'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {profile?.bio || 'No bio available'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-1">
                                            <Link
                                                href="/dashboard/settings"
                                                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <Settings size={18} className="text-gray-400 group-hover:text-blue-600" />
                                                <span className="font-medium">Account Settings</span>
                                            </Link>
                                            
                                            <div className="border-t border-gray-100 my-1"></div>
                                            
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left group"
                                            >
                                                <LogOut size={18} className="text-red-500 group-hover:text-red-600" />
                                                <span className="font-medium">Sign out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fallback logout button if no profile */}
                        {access && !profile && (
                            <button
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                                onClick={handleLogout}
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardNavbar;