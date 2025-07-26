"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search, MessageCircle, Mail, Phone, HelpCircle, BookOpen, Lightbulb, Shield, AlertTriangle } from "lucide-react";

const Help = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I upload files to FileGen?",
            answer: "To upload files, go to the 'Files' section in your dashboard and click the 'Upload' button. You can then select files from your device, add a title, and upload them to your account.",
            category: "Files"
        },
        {
            question: "What file types are supported?",
            answer: "FileGen supports all common file types including documents (PDF, DOC, DOCX), images (JPG, PNG, GIF), videos (MP4, AVI), audio files (MP3, WAV), and many more. There's no restriction on file types.",
            category: "Files"
        },
        {
            question: "What's the maximum file size I can upload?",
            answer: "The maximum file size for uploads is 100MB per file. If you need to upload larger files, please contact our support team for assistance.",
            category: "Files"
        },
        {
            question: "How do I download my files?",
            answer: "You can download files from the 'Files' section by clicking the download button next to any file in your file list. The file will be downloaded to your default download folder.",
            category: "Files"
        },
        {
            question: "Is my data secure on FileGen?",
            answer: "Yes, your data is completely secure. We use bank-grade encryption to protect your files both in transit and at rest. Your files are stored on secure servers with regular backups.",
            category: "Security"
        },
        {
            question: "How do I share files with others?",
            answer: "Currently, files are private to your account. File sharing features are coming soon in future updates.",
            category: "Features"
        },
        {
            question: "Can I organize my files into folders?",
            answer: "File organization features are currently in development. For now, you can use descriptive titles to help organize your files.",
            category: "Features"
        },
        {
            question: "How do I delete files?",
            answer: "To delete files, go to your Files section and look for the delete option next to each file. Please note that deleted files cannot be recovered.",
            category: "Files"
        },
        {
            question: "I forgot my password. How do I reset it?",
            answer: "Click on 'Forgot Password' on the login page and enter your email address. You'll receive instructions to reset your password.",
            category: "Account"
        },
        {
            question: "How do I contact support?",
            answer: "You can contact our support team through the Contact page or email us directly at support@filegen.com. We typically respond within 24 hours.",
            category: "Support"
        }
    ];

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const quickActions = [
        {
            title: "Upload Files",
            description: "Add new files to your account",
            action: "Go to Files → Click Upload",
            icon: <BookOpen className="text-blue-600" size={32} />,
            color: "bg-blue-50 border-blue-200"
        },
        {
            title: "View Files",
            description: "Browse your uploaded files",
            action: "Go to Files section",
            icon: <HelpCircle className="text-green-600" size={32} />,
            color: "bg-green-50 border-green-200"
        },
        {
            title: "Account Settings",
            description: "Manage your account preferences",
            action: "Go to Settings",
            icon: <Shield className="text-purple-600" size={32} />,
            color: "bg-purple-50 border-purple-200"
        },
        {
            title: "Contact Support",
            description: "Get help from our team",
            action: "Use Contact form",
            icon: <MessageCircle className="text-orange-600" size={32} />,
            color: "bg-orange-50 border-orange-200"
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

    const supportChannels = [
        {
            title: "Email Support",
            description: "Get detailed help via email",
            contact: "support@filegen.com",
            icon: <Mail className="text-blue-600" size={24} />,
            responseTime: "24 hours"
        },
        {
            title: "Live Chat",
            description: "Chat with our support team",
            contact: "Available 9AM-5PM PST",
            icon: <MessageCircle className="text-green-600" size={24} />,
            responseTime: "Instant"
        },
        {
            title: "Phone Support",
            description: "Call us for urgent issues",
            contact: "+1 (555) 123-4567",
            icon: <Phone className="text-purple-600" size={24} />,
            responseTime: "Immediate"
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="text-blue-600" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Help & Support</h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Find answers to common questions, learn how to use FileGen effectively, and get the support you need.
                </p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for help topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>


            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <Lightbulb className="text-yellow-600" size={24} />
                        <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
                    </div>
                    <p className="text-gray-600">Find quick answers to the most common questions about FileGen.</p>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {filteredFaqs.map((faq, index) => (
                            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                            {faq.category}
                                        </span>
                                        <span className="font-semibold text-gray-900">{faq.question}</span>
                                    </div>
                                    {openFaq === index ? (
                                        <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 py-4 bg-white border-t border-gray-200">
                                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {filteredFaqs.length === 0 && searchTerm && (
                        <div className="text-center py-8">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                            <p className="text-gray-600">Try searching with different keywords.</p>
                        </div>
                    )}
                </div>
            </div>


        </div>
    );
};

export default Help;
