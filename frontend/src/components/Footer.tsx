export default function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border/40 text-center text-sm text-muted-foreground">
      <p>
        © {new Date().getFullYear()} Energiapp — Todos los derechos reservados.
      </p>
    </footer>
  )
}