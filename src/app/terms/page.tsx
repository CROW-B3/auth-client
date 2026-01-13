"use client";

import { AnimatedBackground, Navbar, NavLink } from "@b3-crow/ui-kit";
import { motion } from "framer-motion";

export default function TermsPage() {
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
					<h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
					<p className="text-gray-500 mb-8">Last updated: January 2025</p>

					<div className="prose prose-invert prose-gray max-w-none space-y-8">
						<section>
							<h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
							<p className="text-gray-400 leading-relaxed">
								By accessing or using CROW&apos;s services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
							<p className="text-gray-400 leading-relaxed">
								CROW provides a unified platform for integrating Web, CCTV, and Social signals into one interaction model. Our services include data collection, analysis, and visualization tools designed for business intelligence and customer engagement optimization.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
							<p className="text-gray-400 leading-relaxed">
								To access certain features of our service, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">4. Acceptable Use</h2>
							<p className="text-gray-400 leading-relaxed">
								You agree not to use the service for any unlawful purpose or in any way that could damage, disable, or impair our servers or networks. You may not attempt to gain unauthorized access to any part of the service, other accounts, or computer systems.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">5. Data and Privacy</h2>
							<p className="text-gray-400 leading-relaxed">
								Your use of our services is also governed by our <a href="/privacy" className="text-violet-400 hover:text-violet-300 underline">Privacy Policy</a>. By using CROW, you consent to the collection and use of information as described in our Privacy Policy.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">6. Intellectual Property</h2>
							<p className="text-gray-400 leading-relaxed">
								The service and its original content, features, and functionality are owned by CROW and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">7. Termination</h2>
							<p className="text-gray-400 leading-relaxed">
								We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will cease immediately.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
							<p className="text-gray-400 leading-relaxed">
								In no event shall CROW, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">9. Changes to Terms</h2>
							<p className="text-gray-400 leading-relaxed">
								We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on this page and updating the &quot;Last updated&quot; date.
							</p>
						</section>

						<section>
							<h2 className="text-xl font-semibold text-white mb-4">10. Contact Us</h2>
							<p className="text-gray-400 leading-relaxed">
								If you have any questions about these Terms, please contact us at <a href="mailto:legal@crowai.dev" className="text-violet-400 hover:text-violet-300 underline">legal@crowai.dev</a>.
							</p>
						</section>
					</div>
				</motion.div>
			</main>
		</div>
	);
}
