"use client";

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '../button/button';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/authSlice";
import type { RootState, AppDispatch } from "@/store/store";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { access } = useSelector((state: RootState) => state.auth);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' }
  ];

  const handleLogout = async () => {
    await dispatch(logout());
    // Remove persisted redux state if using redux-persist
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">
          <Link href="/">Filegen</Link>
        </div>

        {/* Hamburger menu for mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Links */}
        <div className={`flex-col md:flex md:flex-row md:items-center md:gap-6 absolute md:static bg-white w-full left-0 top-16 md:top-0 md:w-auto px-4 md:px-0 ${isOpen ? 'flex' : 'hidden'}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-2 md:py-0 text-lg ${pathname === link.href ? 'text-blue-600 font-semibold' : 'text-gray-700'} hover:text-blue-500`}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 ">
          {access ? (
            <Button onClick={handleLogout}>Logout</Button>
          ) : (
            <>
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Signup</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
