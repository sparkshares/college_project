"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  User, 
  MessageSquare,
  Clock,
  Globe,
  Headphones
} from "lucide-react";

interface ValidationErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  description: string;
  contact: string;
  color: string;
}

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validation functions
  const validateName = (name: string): string | undefined => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (name.length > 50) return "Name must be less than 50 characters";
    return undefined;
  };

  const validateEmail = (email: string): string | undefined => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return undefined;
  };

  const validateSubject = (subject: string): string | undefined => {
    if (!subject) return "Subject is required";
    if (subject.length < 5) return "Subject must be at least 5 characters";
    if (subject.length > 100) return "Subject must be less than 100 characters";
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message) return "Message is required";
    if (message.length < 10) return "Message must be at least 10 characters";
    if (message.length > 1000) return "Message must be less than 1000 characters";
    return undefined;
  };

  // Real-time validation
  useEffect(() => {
    const errors: ValidationErrors = {};
    
    if (name) {
      const nameError = validateName(name);
      if (nameError) errors.name = nameError;
    }
    
    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.email = emailError;
    }
    
    if (subject) {
      const subjectError = validateSubject(subject);
      if (subjectError) errors.subject = subjectError;
    }
    
    if (message) {
      const messageError = validateMessage(message);
      if (messageError) errors.message = messageError;
    }

    setValidationErrors(errors);
    setIsFormValid(
      name.length > 0 && 
      email.length > 0 && 
      subject.length > 0 && 
      message.length > 0 && 
      Object.keys(errors).length === 0
    );
  }, [name, email, subject, message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    const nameError = validateName(name);
    const emailError = validateEmail(email);
    const subjectError = validateSubject(subject);
    const messageError = validateMessage(message);
    
    if (nameError || emailError || subjectError || messageError) {
      setValidationErrors({
        name: nameError,
        email: emailError,
        subject: subjectError,
        message: messageError,
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setValidationErrors({});
      
      // Hide success message after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);
    }, 2000);
  };

  const contactInfo: ContactInfo[] = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      description: "Send us an email anytime",
      contact: "support@filegen.com",
      color: "blue"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Call Us",
      description: "Mon-Fri from 8am to 5pm",
      contact: "+977-1-4444444",
      color: "green"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Visit Us",
      description: "Come say hello at our office",
      contact: "Kathmandu, Nepal",
      color: "purple"
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <Image 
                src="/dllogo.jpg" 
                alt="FileGen Logo" 
                width={200}
                height={200}
                className="mx-auto mb-4"
              />
            </Link>
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Message sent successfully!</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Thank you for reaching out to us. We've received your message and will get back to you within 24 hours.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                💡 <strong>What's next?</strong> Our support team will review your message and respond via email.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setIsSubmitted(false)}
                className="w-full py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Send another message
              </button>
              
              <Link href="/dashboard">
                <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                  Go to Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="animate-pulse">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              💬 Get in Touch with FileGen
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6 leading-tight">
            Contact Us
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
            Have questions, feedback, or need support? Our team is here to help you make the most of FileGen.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactInfo.map((info, index) => (
            <div key={index} className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className={`w-16 h-16 bg-${info.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <div className={`text-${info.color}-600`}>
                  {info.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h3>
              <p className="text-gray-600 mb-4">{info.description}</p>
              <p className="text-blue-600 font-semibold">{info.contact}</p>
            </div>
          ))}
        </div>

        {/* Main Contact Form */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a message</h2>
              <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : name && !validationErrors.name 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {name && !validationErrors.name && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                  )}
                  {validationErrors.name && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                  )}
                </div>
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.email 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : email && !validationErrors.email 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {email && !validationErrors.email && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                  )}
                  {validationErrors.email && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                  )}
                </div>
                {validationErrors.email && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Subject Field */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                      validationErrors.subject 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : subject && !validationErrors.subject 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="What's this about?"
                  />
                  {subject && !validationErrors.subject && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 h-5 w-5" />
                  )}
                  {validationErrors.subject && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 h-5 w-5" />
                  )}
                </div>
                {validationErrors.subject && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.subject}
                  </p>
                )}
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <div className="relative">
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                      validationErrors.message 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : message && !validationErrors.message 
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Tell us more about how we can help you..."
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {message.length}/1000
                  </div>
                </div>
                {validationErrors.message && (
                  <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {validationErrors.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                  isSubmitting || !isFormValid
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending message...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Send message
                  </div>
                )}
              </button>
            </form>
          </div>

          {/* Additional Info */}
          <div className="space-y-8">
            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">How do I upload large files?</h4>
                  <p className="text-gray-600 text-sm">Use our chunked upload system that supports files up to 100MB with pause/resume functionality.</p>
                </div>
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
                  <p className="text-gray-600 text-sm">Yes, we use MD5 verification and secure transmission protocols to protect your files.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Can I edit documents online?</h4>
                  <p className="text-gray-600 text-sm">Absolutely! Use our rich text editor with formatting, lists, and real-time preview.</p>
                </div>
              </div>
            </div>

            {/* Support Hours */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Support Hours</h3>
                  <p className="text-gray-600">We're here when you need us</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="font-semibold text-gray-900">8:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Saturday</span>
                  <span className="font-semibold text-gray-900">9:00 AM - 1:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sunday</span>
                  <span className="font-semibold text-gray-900">Closed</span>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> Emergency support available 24/7 for critical issues.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
