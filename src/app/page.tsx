import Link from "next/link";
import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header showLogo={true} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Simplify Your Business Management
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Comprehensive multi-branch business management system designed to streamline operations, manage payments, and organize documents all in one place.
              </p>

              <div className="flex gap-4 flex-wrap">
                <Link
                  href="/login"
                  className="bg-white text-primary-700 font-semibold py-3 px-8 rounded-lg hover:bg-primary-50 transition-colors shadow-lg"
                >
                  Staff Login
                </Link>
                <Link
                  href="/customer-login"
                  className="bg-primary-500 text-white font-semibold py-3 px-8 rounded-lg hover:bg-primary-400 transition-colors border border-white"
                >
                  Customer Login
                </Link>
              </div>
            </div>

            <div className="bg-primary-500 rounded-2xl p-8 shadow-2xl">
              <div className="aspect-square bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-white font-semibold">Business Management Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Provide Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">What We Provide</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Comprehensive solutions for modern business management</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "👥",
                title: "Multi-Branch Management",
                description: "Manage multiple branches with ease. Centralized control with branch-specific operations.",
              },
              {
                icon: "💼",
                title: "Employee Management",
                description: "Track employee performance, assignments, and work entries across all branches.",
              },
              {
                icon: "👨‍💼",
                title: "Customer Management",
                description: "Organize customer information, track interactions, and manage customer relationships.",
              },
              {
                icon: "💰",
                title: "Payment Processing",
                description: "Secure payment integration with Razorpay. Track and manage all transactions.",
              },
              {
                icon: "📄",
                title: "Document Management",
                description: "Upload, store, and manage important business documents in the cloud.",
              },
              {
                icon: "📊",
                title: "Detailed Reports",
                description: "Generate comprehensive reports on work, payments, and customer activities.",
              },
            ].map((service, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Why Choose Seva Center?</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Benefits that transform your business</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: "Increased Efficiency",
                description: "Automate routine tasks and streamline workflows to boost productivity and reduce manual work.",
              },
              {
                title: "Better Organization",
                description: "Keep all your business data organized in one centralized platform with easy access.",
              },
              {
                title: "Improved Decision Making",
                description: "Access real-time analytics and detailed reports to make informed business decisions.",
              },
              {
                title: "Enhanced Security",
                description: "Multi-tenant architecture ensures complete data isolation and security for your business.",
              },
              {
                title: "Scalability",
                description: "Grow your business without worrying about system limitations. Built to scale.",
              },
              {
                title: "Cost Effective",
                description: "Reduce operational costs with efficient management and automated processes.",
              },
            ].map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-primary-700 mb-3 flex items-center">
                  <span className="text-2xl mr-3">✓</span>
                  {benefit.title}
                </h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 text-center text-gray-900">Get In Touch</h2>
          <p className="text-gray-600 mb-12 text-center text-lg">Have questions? Reach out to us directly!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Email Contact */}
            <a
              href="mailto:reddisekharmarugani@gmail.com"
              className="group bg-gradient-to-br from-primary-600 to-primary-800 text-white p-8 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">✉️</div>
              <h3 className="text-2xl font-semibold mb-3">Send Email</h3>
              <p className="text-primary-100 text-sm mb-4">Click to send an email directly</p>
              <p className="text-lg font-semibold text-white group-hover:underline">reddisekharmarugani@gmail.com</p>
            </a>

            {/* WhatsApp Contact */}
            <a
              href="https://wa.me/919346414887?text=Hi%20Seva%20Center%20Team%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-green-600 to-green-800 text-white p-8 rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">💬</div>
              <h3 className="text-2xl font-semibold mb-3">Chat on WhatsApp</h3>
              <p className="text-green-100 text-sm mb-4">Click to chat directly on WhatsApp</p>
              <p className="text-lg font-semibold text-white group-hover:underline">+91 9346414887</p>
            </a>
          </div>

         
        </div>
      </section>

      {/* Developer Credits Section */}
      <footer className="bg-gray-900 text-gray-300 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-semibold mb-4">About Seva Center</h4>
              <p className="text-sm leading-relaxed">Comprehensive business management solution designed to simplify operations, enhance productivity, and support business growth across multiple branches.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Staff Login</Link></li>
                <li><Link href="/customer-login" className="hover:text-white transition-colors">Customer Login</Link></li>
                <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Get Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:reddisekharmarugani@gmail.com" className="hover:text-white transition-colors">
                    📧 Email Support
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/919346414887" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                    💬 WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Developers</h4>
              <p className="text-sm mb-3">Connect with our development team for technical support and feature requests.</p>
              <a
                href="https://wa.me/919346414887?text=Hi%20Reddi%20Sekhar%2C%20I%20have%20a%20question%20about%20Seva%20Center"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded transition-colors"
              >
                Contact Developers
              </a>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Developer 1 Info */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-white font-bold mb-3">👨‍💻 Reddi Sekhar</h5>
                <ul className="text-sm space-y-2">
                  <li className="text-gray-400">Full-Stack Developer</li>
                  <li className="text-gray-400">Project Lead & Architect</li>
                  <li className="text-gray-400">Next.js & TypeScript Expert</li>
                  <li className="mt-3">
                    <a href="mailto:reddisekharmarugani@gmail.com" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                      ✉️ reddisekharmarugani@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="https://wa.me/919346414887" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                      💬 +91 9346414887
                    </a>
                  </li>
                </ul>
              </div>

              {/* Developer 2 Info */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h5 className="text-white font-bold mb-3">👨‍💼 Muni Rangadu</h5>
                <ul className="text-sm space-y-2">
                  <li className="text-gray-400">Full-Stack Developer</li>
                  <li className="text-gray-400">Backend Specialist</li>
                  <li className="text-gray-400">Database & API Expert</li>
                  <li className="mt-3">
                    <a href="mailto: kuruvamunirangadu.2005@gmail.com" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                      ✉️ kuruvamunirangadu.2005@gmail.com
                    </a>
                  </li>
                  <li>
                    <a href="https://wa.me/918639019597" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 font-semibold transition-colors">
                      💬 +91 8639019597
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center border-t border-gray-700 pt-6">
              <p className="text-sm mb-2">© 2026 Seva Center. All rights reserved.</p>
              <p className="text-sm text-gray-400">
                Proudly developed by <span className="text-white font-semibold">Reddi Sekhar</span> & <span className="text-white font-semibold">Muni Rangadu</span>
              </p>
              <p className="text-xs text-gray-500 mt-3">Version 1.0.0 • Multi-Tenant Business Management System</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
