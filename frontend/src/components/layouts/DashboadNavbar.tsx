"use client";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/authSlice";
import { useRouter } from "next/navigation";
import type { RootState, AppDispatch } from "@/store/store";


const DashboardNavbar = ()=> {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const { access } = useSelector((state: RootState) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        if (typeof window !== "undefined") {
            localStorage.clear();
            sessionStorage.clear();
        }
        router.push("/");
    };

    return (
        <div className="lg:flex justify-between items-center bg-white p-6 shadow-sm z-10 ">
            <div className=" mx-10 flex gap-5">
                <div className="text-xl"><Link href="/">FileGen</Link></div>
            </div>

            <div className=" mx-10 flex gap-5">
                <input type="text" />
                {access && (
                  <button
                    className="text-blue-600 font-semibold hover:underline"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                )}
            </div>
        </div>
    )
}

export default DashboardNavbar;