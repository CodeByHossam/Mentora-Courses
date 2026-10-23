import React from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ChevronRight,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-footer text-white">
      <div className="container py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
        {/* Company Info */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg lg:text-xl text-accent">About Mentora</h3>
          <p className="text-sm text-accent-dark">
            Empowering learners worldwide with quality education and practical
            skills for success.
          </p>
          <div className="flex space-x-3">
            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="p-2 rounded-full bg-soDark hover:bg-primary transition-colors"
              >
                <Icon className="w-5 h-5 text-accent hover:text-white transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg lg:text-xl text-accent">Quick Links</h3>
          <ul className="space-y-2">
            {[
              { label: "Courses", to: "/courses" },
              { label: "About Us", to: "/about" },
              { label: "Contact", to: "/contact" },
              { label: "Blog", to: "/blog" },
            ].map((link, i) => (
              <li key={i}>
                <Link
                  to={link.to}
                  className="flex items-center gap-2 text-sm text-accent-dark hover:text-accent transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-accent-dark group-hover:text-accent transition-colors" />
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg lg:text-xl text-accent">Contact Info</h3>
          <ul className="space-y-2 text-sm text-accent-dark">
            <li className="flex items-start gap-2">
              <Mail className="w-5 h-5 text-accent mt-0.5" />
              info@Mentora.com
            </li>
            <li className="flex items-start gap-2">
              <Phone className="w-5 h-5 text-accent mt-0.5" />
              +1 (555) 123-4567
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-accent mt-0.5" />
              123 Education St, Learning City, ED 12345
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="space-y-4">
          <h3 className="font-heading text-lg lg:text-xl text-accent">Newsletter</h3>
          <p className="text-sm text-accent-dark">
            Subscribe to our newsletter for updates and exclusive offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 rounded-lg bg-soDark text-accent-dark placeholder:text-accent-dark focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            <button
              type="submit"
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Send className="w-4 h-4 text-white" />
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-12 pt-6 border-t border-soDark text-center text-accent-dark text-sm">
        © {new Date().getFullYear()} Mentora. All rights reserved.
      </div>
      
      {/* Developer Signature */}
      <div className="mt-4 pt-4 border-t border-soDark text-center text-xs text-accent-dark">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <span>Coded by</span>
          <span className="text-accent font-medium">Hossam</span>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/CodeByHossam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-soDark hover:bg-primary text-accent-dark hover:text-white rounded-md transition-all duration-200 hover:-translate-y-0.5"
              aria-label="GitHub Profile"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a
              href="mailto:eng.hossam00@gmail.com"
              className="p-1.5 bg-soDark hover:bg-primary text-accent-dark hover:text-white rounded-md transition-all duration-200 hover:-translate-y-0.5 relative group"
              aria-label="Email Contact"
              title="eng.hossam00@gmail.com"
            >
              <Mail className="w-3.5 h-3.5" />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                eng.hossam00@gmail.com
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
