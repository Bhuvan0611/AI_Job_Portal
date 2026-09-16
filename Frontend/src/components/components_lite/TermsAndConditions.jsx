import React from "react";
import Navbar from "./Navbar";

const TermsAndConditions = () => {
  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 md:px-8">
        <h1 className="text-3xl font-extrabold text-[#6B3AC2] mb-6 border-b pb-4">
          Terms and Conditions
        </h1>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this Job Portal, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">2. User Conduct</h2>
            <p>
              You agree to use this site only for lawful purposes, and in a manner that does not infringe the rights of, or restrict or inhibit the use and enjoyment of this site by any third party. Prohibited behavior includes harassing or causing distress to any person, transmitting obscene or offensive content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">3. Employer Obligations</h2>
            <p>
              Employers and recruiters must post accurate, non-discriminatory job listings. You agree not to post false or misleading information about the job, company, or salary. We reserve the right to remove any postings that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">4. Data Privacy</h2>
            <p>
              Your privacy is extremely important to us. By using this service, you consent to the collection, processing, and storage of your personal information (including resumes and profile data) as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">5. Disclaimer of Warranties</h2>
            <p>
              This portal is provided on an "as is" and "as available" basis. We make no representations or warranties of any kind, express or implied, as to the operation of the site or the information, content, or materials included on this site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">6. Limitation of Liability</h2>
            <p>
              We shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or the inability to use the service.
            </p>
          </section>

          <div className="mt-8 pt-8 border-t text-sm text-gray-500">
            Last Updated: June 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
