import { Link } from 'react-router'
import {
  TrendingUp,
  Zap,
  ArrowRight,
  Sparkles,
  BarChart3,
  Lightbulb,
  ChartColumn,
  CpuIcon,
  Blender,
  Brain,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import '../App.css'

const features = [
  {
    icon: ChartColumn,
    title: 'Gestiona tu consumo eléctrico',
    description:
      'Gestión y visualización de datos de consumo eléctrico según tus boletas.',
  },
  {
    icon: TrendingUp,
    title: 'Predicción de Gastos',
    description:
      'Modelos algorítmicos proyectan tu consumo mensual para evitar sorpresas al finalizar el mes.',
  },
  {
    icon: Blender,
    title: 'Gestiona tus electrodomésticos',
    description:
      'Añade y gestiona tus electrodomésticos para controlar y optimizar el consumo de energía.',
  },
  {
    icon: Brain,
    title: 'Consejos y recomendaciones',
    description:
      'Recomendaciones personalizadas según tu consumo, electrodomésticos y los datos que provees.',
  },
]

const highlights = [
  { icon: BarChart3, label: 'Dashboard con lo importante' },
  { icon: CpuIcon, label: 'Predicción de gastos' },
  { icon: Lightbulb, label: 'Consejos de ahorro' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-amber-500/30 selection:text-amber-300 flex flex-col">
      <Navbar />

      {/* ───── Hero Section ───── */}
      <header className="relative pt-32 pb-24 px-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto flex-1">
        {/* Badge decorativo */}
        <Badge
          variant="secondary"
          className="mb-6 gap-1.5 px-3 py-1 text-xs rounded-full border-amber-500/40 text-amber-300"
        >
          <Sparkles className="size-3" />
          Ahorrar energía nunca fue tan simple.
        </Badge>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl leading-tight">
          Gestiona tu consumo eléctrico {' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-yellow-300">
            de manera inteligente
          </span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Monitorea tu consumo eléctrico, anticipa el costo de tus próximas boletas y recibe
          estrategias de optimización automatizadas para reducir los gastos de tu hogar.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button
              size="lg"
              className="rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow-[0_0_20px_rgba(251,191,36,0.2)] cursor-pointer gap-2"
            >
              Comenzar Ahora
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <a href="#caracteristicas">
            <Button variant="outline" size="lg" className="rounded-full cursor-pointer">
              Conocer más
            </Button>
          </a>
        </div>

        {/* Highlights rápidos */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {highlights.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <Icon className="size-4 text-amber-400" />
              </div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ───── Features Section ───── */}
      <section
        id="caracteristicas"
        className="py-24 border-t border-border/40 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              ¿Cómo funciona?
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Cuatro pilares para tu ahorro energético
            </h2>
            <p className="mt-4 text-muted-foreground">
              Diseñado para transformar datos eléctricos crudos en decisiones inteligentes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="bg-card/50 border-border/60 hover:border-amber-500/40 transition-colors group/card"
              >
                <CardHeader>
                  <div className="p-3 rounded-xl bg-amber-500/10 w-fit mb-2 group-hover/card:bg-amber-500/20 transition-colors">
                    <Icon className="size-6 text-amber-400" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-24 px-6 border-t border-border/40">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-2xl bg-linear-to-br from-amber-500/10 to-yellow-400/10 border border-amber-500/20">
            <Zap className="size-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">
              ¿Listo para tomar el control?
            </h3>
            <p className="mt-2 text-muted-foreground">
              Únete hoy de manera gratuita y toma el control de tu consumo eléctrico.
            </p>
            <Link to="/login" className="inline-block mt-6">
              <Button
                size="lg"
                className="rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold shadow-[0_0_20px_rgba(251,191,36,0.2)] cursor-pointer gap-2"
              >
                Empezar gratis
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <Footer />
    </div>
  )
}
