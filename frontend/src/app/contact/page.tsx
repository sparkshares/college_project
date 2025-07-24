export default function Contact() {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-gray-800">
      <h1 className="text-3xl font-bold mb-4 text-blue-700">Contact Us</h1>
      <p className="mb-6 text-lg">
        Have questions, feedback, or need support? Reach out to the FileGen team!
      </p>
      <div className="mb-8">
        <div className="mb-2">
          <span className="font-semibold">Email:</span> <a href="mailto:support@filegen.com" className="text-blue-600 hover:underline">support@filegen.com</a>
        </div>
        <div>
          <span className="font-semibold">Address:</span> Kathmandu, Nepal
        </div>
      </div>
      <form className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
        <input
          type="text"
          placeholder="Your Name"
          className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
        <input
          type="email"
          placeholder="Your Email"
          className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          required
        />
        <textarea
          placeholder="Your Message"
          className="border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
          rows={4}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
