"use client";

import { AnimatedBackground, Navbar, NavLink } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";

export default function PrivacyPage() {
	return (
		<div className="min-h-screen flex flex-col antialiased selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden relative">
			<AnimatedBackground />

			<Navbar
				logo={{ text: "CROW", src: "/favicon.webp", alt: "CROW Logo" }}
				rightContent={
					<NavLink href="/signup">Sign Up</NavLink>
				}
			/>

			<main className="flex-grow relative z-10 w-full px-4 py-12">
				<motion.div
					className="max-w-3xl mx-auto"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
					<p className="text-gray-500 mb-8">Last updated: January 2025</p>

					<div className="prose prose-invert prose-gray max-w-none space-y-8">
						<section>
							<h2 className="text-xl font-semibold text-white mb-4">1. Introduction</h2>
							<p className="text-gray-400 leading-relaxed">
								CROW (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">2. Information We Collect</h2>
							<p className="text-gray-400 leading-relaxed mb-4">
								We collect information you provide directly to us, including:
							</p>
							<ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
								<li>Account information (name, email, organization details)</li>
								<li>Payment and billing information</li>
								<li>Communications you send to us</li>
								<li>Data you upload or connect through our integrations</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
							<p className="text-gray-400 leading-relaxed mb-4">
								We use the information we collect to:
							</p>
							<ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
								<li>Provide, maintain, and improve our services</li>
								<li>Process transactions and send related information</li>
								<li>Send technical notices, updates, and support messages</li>
								<li>Respond to your comments, questions, and requests</li>
								<li>Monitor and analyze trends, usage, and activities</li>
								<li>Detect, investigate, and prevent security incidents</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">4. Data Sharing and Disclosure</h2>
							<p className="text-gray-400 leading-relaxed">
								We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, and email delivery. We may also share information when required by law or to protect our rights.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">5. Data Security</h2>
							<p className="text-gray-400 leading-relaxed">
								We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, access controls, and regular security assessments.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">6. Data Retention</h2>
							<p className="text-gray-400 leading-relaxed">
								We retain your information for as long as your account is active or as needed to provide you services. We will also retain and use your information as necessary to comply with legal obligations, resolve disputes, and enforce our agreements.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">7. Your Rights</h2>
							<p className="text-gray-400 leading-relaxed mb-4">
								Depending on your location, you may have certain rights regarding your personal information:
							</p>
							<ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
								<li>Access and receive a copy of your data</li>
								<li>Rectify inaccurate or incomplete data</li>
								<li>Request deletion of your data</li>
								<li>Object to or restrict processing of your data</li>
								<li>Data portability</li>
							</ul>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">8. Cookies and Tracking</h2>
							<p className="text-gray-400 leading-relaxed">
								We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our service.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">9. International Data Transfers</h2>
							<p className="text-gray-400 leading-relaxed">
								Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
							<p className="text-gray-400 leading-relaxed">
								We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
							<p className="text-gray-400 leading-relaxed">
								If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:privacy@crowai.dev" className="text-violet-400 hover:text-violet-300 underline">privacy@crowai.dev</a>.
							</p>
						</section>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
