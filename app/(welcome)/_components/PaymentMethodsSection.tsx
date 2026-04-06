"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PAYMENT_LOGOS } from "@/constants/welcome/paymentLogos.constants";

export default function PaymentMethodsSection() {
  return (
    <section className="p-8 border border-primary/15 rounded-md relative overflow-hidden">
      <div className="">
        {/* Logos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-6">
          {PAYMENT_LOGOS.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="group flex items-center justify-center rounded-md border bg-transparent backdrop-blur-md p-3 hover:shadow-md transition-all"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={80}
                height={40}
                className="object-contain grayscale-50 group-hover:grayscale-0 transition duration-300"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
