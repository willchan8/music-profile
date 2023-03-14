import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";

const inter = Inter({ subsets: ["latin"] });

export default function Main() {
  return (
    <main className={styles.main}>
      <p className={inter.className}>Success!</p>
    </main>
  );
}
