import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-blue-600">Privacy Policy for Job Hunt</h1>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        This Privacy Policy outlines how we collect, use, and protect your
        information when you visit our job portal website.
      </p>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
        <li>
          <strong>Personal Information:</strong>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Resume/CV</li>
          </ul>
        </li>
        <li>
          <strong>Usage Data:</strong>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Pages visited</li>
            <li>Time spent on pages</li>
          </ul>
        </li>
      </ul>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
        <li>To provide and maintain our services</li>
        <li>To notify you about changes to our services</li>
        <li>To allow you to participate in interactive features</li>
        <li>To provide customer support</li>
        <li>
          To gather analysis or valuable information so that we can improve our
          services
        </li>
        <li>To monitor the usage of our services</li>
        <li>To detect, prevent, and address technical issues</li>
      </ul>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">4. Data Security</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We take the security of your personal information seriously and
        implement appropriate technical and organizational measures to protect
        it.
      </p>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">5. Sharing Your Information</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We do not sell or rent your personal information to third parties. We
        may share your information with:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
        <li>Service providers who assist us in operating our website</li>
        <li>Law enforcement agencies if required by law</li>
      </ul>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
      <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
        <li>Access your personal information</li>
        <li>Request correction of your personal information</li>
        <li>Request deletion of your personal information</li>
      </ul>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">7. Changes to This Privacy Policy</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        We may update our Privacy Policy from time to time. We will notify you
        of any changes by posting the new Privacy Policy on this page.
      </p>

      <h2 className="text-xl md:text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
      <p className="text-gray-700 leading-relaxed mb-4">
        If you have any questions about this Privacy Policy, please contact us
        at [your email address].
      </p>
    </div>
  );
};

export default PrivacyPolicy;
