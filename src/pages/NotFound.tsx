import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25"
        >
          <Compass className="h-8 w-8" />
        </motion.div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="mt-6 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:shadow-sky-500/40"
        >
          Back to dashboard
        </Link>
      </div>
    </PageTransition>
  );
}
