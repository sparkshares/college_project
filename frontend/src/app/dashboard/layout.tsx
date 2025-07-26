"use client";
import DashboardNavbar from "@/components/layouts/DashboadNavbar";
import DashboardSidebar from "@/components/layouts/DashboadSidebar";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RootState } from "@/store/store";
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { Provider } from 'react-redux';

const DashboardLayout = ({children }:{children : React.ReactNode}) => {
    const { access } = useSelector((state: RootState) => state.auth);
    const router = useRouter();

    useEffect(() => {
        if (!access) {
            router.replace("/");
        }
    }, [access, router]);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
                    <DashboardNavbar/>
                    <div className="flex">
                        <DashboardSidebar/>
                        <main className="flex-1 ml-72">
                            <div className="p-4 sm:p-6 lg:p-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </PersistGate>
        </Provider>
    );
}

export default DashboardLayout;