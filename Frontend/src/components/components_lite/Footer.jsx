import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <div>
      {/* Footer for the current page */}
      <div className="text-center p-4 md:p-8 bg-[#f1f1f1] text-sm md:text-base flex flex-col gap-2">
        <p>All rights reserved.</p>
        <p>
          Powered by <a href="https://github.com/mohithannadata12390" className="text-blue-600 hover:underline">Mohith Annadatha</a>
        </p>
        <p className="flex flex-wrap justify-center gap-2">
          <Link to={"/PrivacyPolicy"} className="hover:text-[#FA4F09] transition-colors">Privacy Policy </Link>
          <span className="hidden sm:inline">|</span>
          <Link to={"/TermsofService"} className="hover:text-[#FA4F09] transition-colors"> Terms of Service</Link>
        </p>
      </div>
    </div>
  );
};

export default Footer;
