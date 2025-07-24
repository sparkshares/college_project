"use client";

import { useState } from "react";

const Help = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const ChevronDownIcon = ({ className = "h-5 w-5 text-gray-500" }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 9l-7 7-7-7" />
        </svg>
    );

    const ChevronUpIcon = ({ className = "h-5 w-5 text-gray-500" }: { className?: string }) => (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 15l7-7 7 7" />
        </svg>
    );

    const faqs = [
        {
            question: "How do I upload files to FileGen?",
            answer: "To upload files, go to the 'Files' section in your dashboard and click the 'Upload' button. You can then select files from your device, add a title, and upload them to your account."
        },
        {
            question: "What file types are supported?",
            answer: "FileGen supports all common file types including documents (PDF, DOC, DOCX), images (JPG, PNG, GIF), videos (MP4, AVI), audio files (MP3, WAV), and many more. There's no restriction on file types."
        },
        {
            question: "What's the maximum file size I can upload?",
            answer: "The maximum file size for uploads is 100MB per file. If you need to upload larger files, please contact our support team for assistance."
        },
        {
            question: "How do I download my files?",
            answer: "You can download files from the 'Files' section by clicking the download button next to any file in your file list. The file will be downloaded to your default download folder."
        },
        {
            question: "Is my data secure on FileGen?",
            answer: "Yes, your data is completely secure. We use bank-grade encryption to protect your files both in transit and at rest. Your files are stored on secure servers with regular backups."
        },
        {
            question: "How do I share files with others?",
            answer: "Currently, files are private to your account. File sharing features are coming soon in future updates."
        },
        {
            question: "Can I organize my files into folders?",
            answer: "File organization features are currently in development. For now, you can use descriptive titles to help organize your files."
        },
        {
            question: "How do I delete files?",
            answer: "To delete files, go to your Files section and look for the delete option next to each file. Please note that deleted files cannot be recovered."
        },
        {
            question: "I forgot my password. How do I reset it?",
            answer: "Click on 'Forgot Password' on the login page and enter your email address. You'll receive instructions to reset your password."
        },
        {
            question: "How do I contact support?",
            answer: "You can contact our support team through the Contact page or email us directly at support@filegen.com. We typically respond within 24 hours."
        }
    ];

    const quickActions = [
        {
            title: "Upload Files",
            description: "Add new files to your account",
            action: "Go to Files → Click Upload",
            icon: "📁"
        },
        {
            title: "View Files",
            description: "Browse your uploaded files",
            action: "Go to Files section",
            icon: "👀"
        },
        {
            title: "Account Settings",
            description: "Manage your account preferences",
            action: "Go to Settings",
            icon: "⚙️"
        },
        {
            title: "Contact Support",
            description: "Get help from our team",
            action: "Use Contact form",
            icon: "💬"
        }
    ];

    const troubleshooting = [
        {
            issue: "Upload Failed",
            solution: "Check your internet connection and ensure the file is under 100MB. Try refreshing the page and uploading again."
        },
        {
            issue: "Can't Login",
            solution: "Verify your email and password are correct. Use the 'Forgot Password' link if needed. Clear your browser cache if the issue persists."
        },
        {
            issue: "File Not Downloading",
            solution: "Check your browser's download settings and ensure pop-ups are allowed for FileGen. Try using a different browser if the issue continues."
        },
        {
            issue: "Page Loading Slowly",
            solution: "Check your internet connection. Clear your browser cache and cookies. Try using a different browser or device."
        }
    ];

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
                    <p className="text-xl text-gray-600">Find answers to your questions and get the most out of FileGen</p>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {quickActions.map((action, index) => (
                            <div key={index} className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                <div className="text-3xl mb-3">{action.icon}</div>
                                <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                                <p className="text-sm text-gray-600 mb-3">{action.description}</p>
                                <p className="text-xs text-blue-600 font-medium">{action.action}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg">
                                <button
                                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleFaq(index)}
                                >
                                    <span className="font-medium text-gray-900">{faq.question}</span>
                                    {openFaq === index ? (
                                        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                                    ) : (
                                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-4">
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Issues & Solutions</h2>
                    <div className="space-y-6">
                        {troubleshooting.map((item, index) => (
                            <div key={index} className="border-l-4 border-red-400 pl-6">
                                <h3 className="font-semibold text-gray-900 mb-2">❌ {item.issue}</h3>
                                <p className="text-gray-600">✅ {item.solution}</p>
                            </div>
                        ))}
                    </div>
                </div>

                
            </div>
        </div>
    );
}

export default Help;