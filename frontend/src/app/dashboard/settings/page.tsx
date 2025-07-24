import React from "react";

const Settings = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Profile</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border rounded px-4 py-2"
                placeholder="Your Name"
                defaultValue="Arjun Ghimire"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-4 py-2"
                placeholder="you@email.com"
                defaultValue="arjun@email.com"
              />
            </div>
            <button
              type="submit"
              className="mt-2 bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </form>
        </div>
        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Account</h2>
          <form className="flex flex-col gap-4">
            <div>
              <label className="block text-gray-600 mb-1">Change Password</label>
              <input
                type="password"
                className="w-full border rounded px-4 py-2"
                placeholder="New Password"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Confirm Password</label>
              <input
                type="password"
                className="w-full border rounded px-4 py-2"
                placeholder="Confirm Password"
              />
            </div>
            <button
              type="submit"
              className="mt-2 bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
            >
              Update Password
            </button>
          </form>
        </div>
        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Notifications</h2>
          <form className="flex flex-col gap-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="accent-blue-600" defaultChecked />
              <span>Email me about new reports</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="accent-blue-600" />
              <span>Send push notifications</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="accent-blue-600" defaultChecked />
              <span>Weekly summary email</span>
            </label>
            <button
              type="submit"
              className="mt-2 bg-purple-500 text-white rounded px-4 py-2 font-semibold hover:bg-purple-600 transition w-fit"
            >
              Save Notification Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;