import { motion } from "framer-motion";

const Card = ({ children, className = "", glow = false, hover = false, animate = true, ...props }) => {
  const base = `card transition-all duration-300 ${className}`;

  const hoverProps = hover ? {
    whileHover: { y: -3, boxShadow: "0 16px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.15)" },
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  } : {};

  if (!animate) return <div className={base} {...props}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={base}
      {...hoverProps}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
