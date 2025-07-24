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
                <div className="min-h-screen flex flex-col">
                    <DashboardNavbar/>
                    <div className="flex flex-1">
                        <DashboardSidebar/>
                        <main className="flex-1 p-6">{children}</main>
                    </div>
                </div>
            </PersistGate>
        </Provider>
    );
}

export default DashboardLayout;