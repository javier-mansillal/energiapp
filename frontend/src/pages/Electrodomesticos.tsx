import { Refrigerator } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Electrodomesticos() {
  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-amber-500/10">
          <Refrigerator className="size-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Electrodomésticos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los aparatos de tu hogar.
          </p>
        </div>
      </div>

      <Card className="bg-card/50 border-border/60">
        <CardHeader>
          <CardTitle>Mis electrodomésticos</CardTitle>
          <CardDescription>
            Agrega, edita o elimina aparatos de tu hogar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Placeholder</Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            Aquí irá el listado y formulario de electrodomésticos.
          </p>
        </CardContent>
      </Card>
    </AppLayout>
  )
}