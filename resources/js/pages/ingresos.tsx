"use client";

import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState, useCallback } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, CreditCard, Banknote, Smartphone } from 'lucide-react';

export default function Ingresos() {
    type IngresoData = {
        id: number;
        fecha: string;
        concepto: string;
        chofer: string;
        vehiculo: string;
        chapa: string;
        nro_contrato: number;
        monto: number;
        moneda: string;
        forma_pago: string;
        tipo: 'PAGO' | 'OTROS';
        estado: 'CONFIRMADO' | 'PENDIENTE';
    };

    type ResumenIngresos = {
        total_ingresos: number;
        ingresos_efectivo: number;
        ingresos_transferencia: number;
        ingresos_pos: number;
        cantidad_transacciones: number;
    };

    const [ingresos, setIngresos] = useState<IngresoData[]>([]);
    const [resumen, setResumen] = useState<ResumenIngresos>({
        total_ingresos: 0,
        ingresos_efectivo: 0,
        ingresos_transferencia: 0,
        ingresos_pos: 0,
        cantidad_transacciones: 0,
    });
    
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    // Filtros
    const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
    const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
    const [filtroChofer, setFiltroChofer] = useState('');
    const [filtroVehiculo, setFiltroVehiculo] = useState('');
    const [filtroFormaPago, setFiltroFormaPago] = useState('');

    // Ordenamiento
    const [ordenCampo, setOrdenCampo] = useState<keyof IngresoData>('fecha');
    const [orden, setOrden] = useState<'asc' | 'desc'>('desc');

    const loadIngresos = useCallback(async () => {
        try {
            // Cargar datos de ingresos
            const resIngresos = await fetch("/getIngresosData", { credentials: 'same-origin' });
            if (resIngresos.ok) {
                const ingresosData: IngresoData[] = await resIngresos.json();
                setIngresos(ingresosData);
                
                // Calcular totales localmente desde los datos cargados
                const totalIngresos = ingresosData.reduce((sum: number, ingreso: IngresoData) => sum + Number(ingreso.monto || 0), 0);
                const ingresosEfectivo = ingresosData
                    .filter((ingreso: IngresoData) => ingreso.forma_pago === 'EFECTIVO')
                    .reduce((sum: number, ingreso: IngresoData) => sum + Number(ingreso.monto || 0), 0);
                const ingresosTransferencia = ingresosData
                    .filter((ingreso: IngresoData) => ingreso.forma_pago === 'TRANSFERENCIA')
                    .reduce((sum: number, ingreso: IngresoData) => sum + Number(ingreso.monto || 0), 0);
                const ingresosPOS = ingresosData
                    .filter((ingreso: IngresoData) => ingreso.forma_pago === 'POS')
                    .reduce((sum: number, ingreso: IngresoData) => sum + Number(ingreso.monto || 0), 0);
                
                // Actualizar resumen con cálculos locales
                setResumen({
                    total_ingresos: totalIngresos,
                    ingresos_efectivo: ingresosEfectivo,
                    ingresos_transferencia: ingresosTransferencia,
                    ingresos_pos: ingresosPOS,
                    cantidad_transacciones: ingresosData.length
                });
                
                console.log('Datos calculados localmente:', {
                    total: totalIngresos,
                    efectivo: ingresosEfectivo,
                    transferencia: ingresosTransferencia,
                    pos: ingresosPOS,
                    cantidad: ingresosData.length
                });
                
            } else {
                toast.error('Error al cargar los datos de ingresos');
                setIngresos([]);
            }

            // Intentar cargar totales del backend (como respaldo)
            try {
                const resTotales = await fetch("/getTotalesIngresos", { credentials: 'same-origin' });
                console.log('Response status getTotalesIngresos:', resTotales.status);
                
                if (resTotales.ok) {
                    const totalesData = await resTotales.json();
                    console.log('Datos del backend getTotalesIngresos:', totalesData);
                    
                    // Solo usar datos del backend si son mayores que 0
                    if (totalesData.total_ingresos > 0) {
                        setResumen(totalesData);
                    }
                } else {
                    console.error('Error en getTotalesIngresos:', resTotales.statusText);
                }
            } catch (backendError) {
                console.error('Error al cargar totales del backend:', backendError);
                // Los totales locales ya están establecidos, no hacer nada
            }
            
        } catch (error) {
            console.error('Error loading ingresos:', error);
            toast.error('Error de conexión al cargar los datos');
            setIngresos([]);
            setResumen({
                total_ingresos: 0,
                ingresos_efectivo: 0,
                ingresos_transferencia: 0,
                ingresos_pos: 0,
                cantidad_transacciones: 0,
            });
        }
    }, []);

    useEffect(() => {
        loadIngresos();
    }, [loadIngresos]);

    // Filtrado
    const ingresosFiltrados = ingresos.filter((ingreso) => {
        const fechaIngreso = ingreso.fecha ? ingreso.fecha.split('T')[0] : '';
        const cumpleFechaDesde = !filtroFechaDesde || fechaIngreso >= filtroFechaDesde;
        const cumpleFechaHasta = !filtroFechaHasta || fechaIngreso <= filtroFechaHasta;
        const cumpleChofer = !filtroChofer || ingreso.chofer.toLowerCase().includes(filtroChofer.toLowerCase());
        const cumpleVehiculo = !filtroVehiculo || ingreso.vehiculo.toLowerCase().includes(filtroVehiculo.toLowerCase());
        const cumpleFormaPago = !filtroFormaPago || filtroFormaPago === 'all' || ingreso.forma_pago === filtroFormaPago;

        return cumpleFechaDesde && cumpleFechaHasta && cumpleChofer && cumpleVehiculo && cumpleFormaPago;
    });

    // Calcular totales de los datos filtrados para las tarjetas
    const resumenFiltrado = {
        total_ingresos: ingresosFiltrados.reduce((sum, ingreso) => sum + Number(ingreso.monto || 0), 0),
        ingresos_efectivo: ingresosFiltrados
            .filter(ingreso => ingreso.forma_pago === 'EFECTIVO')
            .reduce((sum, ingreso) => sum + Number(ingreso.monto || 0), 0),
        ingresos_transferencia: ingresosFiltrados
            .filter(ingreso => ingreso.forma_pago === 'TRANSFERENCIA')
            .reduce((sum, ingreso) => sum + Number(ingreso.monto || 0), 0),
        ingresos_pos: ingresosFiltrados
            .filter(ingreso => ingreso.forma_pago === 'POS')
            .reduce((sum, ingreso) => sum + Number(ingreso.monto || 0), 0),
        cantidad_transacciones: ingresosFiltrados.length
    };

    // Ordenamiento
    const ingresosOrdenados = [...ingresosFiltrados].sort((a, b) => {
        const aVal = String(a[ordenCampo] ?? '').toLowerCase();
        const bVal = String(b[ordenCampo] ?? '').toLowerCase();
        if (aVal < bVal) return orden === 'asc' ? -1 : 1;
        if (aVal > bVal) return orden === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginación
    const totalPaginas = Math.ceil(ingresosOrdenados.length / itemsPorPagina);
    const ingresosPaginados = ingresosOrdenados.slice(
        (paginaActual - 1) * itemsPorPagina,
        paginaActual * itemsPorPagina
    );

    // Reset página cuando cambian filtros
    useEffect(() => {
        setPaginaActual(1);
    }, [filtroFechaDesde, filtroFechaHasta, filtroChofer, filtroVehiculo, filtroFormaPago, itemsPorPagina]);

    const exportToExcel = () => {
        if (ingresosFiltrados.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        const dataForExcel = ingresosFiltrados.map(ingreso => ({
            'Fecha': ingreso.fecha ? ingreso.fecha.split('T')[0] : '-',
            'Concepto': ingreso.concepto,
            'Chofer': ingreso.chofer,
            'Vehículo': ingreso.vehiculo,
            'Chapa': ingreso.chapa,
            'Contrato': ingreso.nro_contrato,
            'Monto': ingreso.monto,
            'Moneda': ingreso.moneda,
            'Forma Pago': ingreso.forma_pago,
            'Tipo': ingreso.tipo,
            'Estado': ingreso.estado
        }));

        const headers = Object.keys(dataForExcel[0] || {});
        const csvContent = [
            headers.join(','),
            ...dataForExcel.map(row => 
                headers.map(header => {
                    const value = row[header as keyof typeof row];
                    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ingresos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Se exportaron ${dataForExcel.length} registros a Excel`);
    };

    const limpiarFiltros = () => {
        setFiltroFechaDesde('');
        setFiltroFechaHasta('');
        setFiltroChofer('');
        setFiltroVehiculo('');
        setFiltroFormaPago('');
    };

    return (
        <AppLayout>
            <Head title="Reporte de Ingresos" />
            <div className="flex flex-col gap-6 p-4">

                {/* Tarjetas de resumen */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {Number(resumenFiltrado.total_ingresos).toLocaleString("es-PY", { 
                                    style: "currency", 
                                    currency: "PYG", 
                                    minimumFractionDigits: 0 
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Total filtrado</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Efectivo</CardTitle>
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {Number(resumenFiltrado.ingresos_efectivo).toLocaleString("es-PY", { 
                                    style: "currency", 
                                    currency: "PYG", 
                                    minimumFractionDigits: 0 
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Pagos en efectivo filtrados</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos Transferencia</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {Number(resumenFiltrado.ingresos_transferencia).toLocaleString("es-PY", { 
                                    style: "currency", 
                                    currency: "PYG", 
                                    minimumFractionDigits: 0 
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Transferencias filtradas</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ingresos POS</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {Number(resumenFiltrado.ingresos_pos).toLocaleString("es-PY", { 
                                    style: "currency", 
                                    currency: "PYG", 
                                    minimumFractionDigits: 0 
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">Pagos POS filtrados</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros y tabla */}
                <Card>
                    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-left gap-2 md:gap-4 px-4 py-2 flex-wrap">
                        <div>
                            <Label>Fecha Desde</Label>
                            <Input
                                type="date"
                                value={filtroFechaDesde}
                                onChange={e => setFiltroFechaDesde(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        <div>
                            <Label>Fecha Hasta</Label>
                            <Input
                                type="date"
                                value={filtroFechaHasta}
                                onChange={e => setFiltroFechaHasta(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        <div>
                            <Label>Chofer</Label>
                            <Input
                                placeholder="Chofer"
                                value={filtroChofer}
                                onChange={e => setFiltroChofer(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>
                        <div>
                            <Label>Vehículo</Label>
                            <Input
                                placeholder="Vehículo"
                                value={filtroVehiculo}
                                onChange={e => setFiltroVehiculo(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>
                        <div>
                            <Label>Forma Pago</Label>
                            <Select value={filtroFormaPago} onValueChange={setFiltroFormaPago}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                                    <SelectItem value="POS">POS</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Ordenar por</Label>
                            <Select value={ordenCampo} onValueChange={value => setOrdenCampo(value as keyof IngresoData)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fecha">Fecha</SelectItem>
                                    <SelectItem value="chofer">Chofer</SelectItem>
                                    <SelectItem value="vehiculo">Vehículo</SelectItem>
                                    <SelectItem value="monto">Monto</SelectItem>
                                    <SelectItem value="tipo">Tipo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setOrden(orden === 'asc' ? 'desc' : 'asc')}
                                className="w-[140px]"
                            >
                                {orden === 'asc' ? 'Ascendente' : 'Descendente'}
                            </Button>
                        </div>
                        <div>
                            <Label>Items por página</Label>
                            <Select value={String(itemsPorPagina)} onValueChange={value => setItemsPorPagina(Number(value))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Cantidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 20, 50, 100].map(num => (
                                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button
                                onClick={limpiarFiltros}
                                variant="outline"
                                className="bg-gray-100 hover:bg-gray-200"
                            >
                                Limpiar filtros
                            </Button>
                            <Button
                                onClick={exportToExcel}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                Exportar Excel
                            </Button>
                        </div>
                    </div>

                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Detalle de Ingresos</span>
                            <div className="text-sm text-muted-foreground font-normal">
                                Mostrando {ingresosPaginados.length} de {ingresosFiltrados.length} registros
                            </div>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Listado completo de ingresos por pagos y otros conceptos.</p>
                    </CardHeader>

                    <CardContent className="overflow-x-auto p-6">
                        <Table>
                            <TableCaption>Lista de ingresos recientes.</TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha Pago</TableHead>
                                    <TableHead>Concepto</TableHead>
                                    <TableHead>Chofer</TableHead>
                                    <TableHead>Vehículo</TableHead>
                                    <TableHead>Chapa</TableHead>
                                    {/* <TableHead>Contrato</TableHead> */}
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Forma Pago</TableHead>
                                    {/* <TableHead>Tipo</TableHead>
                                    <TableHead>Estado</TableHead> */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ingresosPaginados.map((ingreso) => (
                                    <TableRow key={ingreso.id}>
                                        <TableCell>{ingreso.fecha ? ingreso.fecha.split('T')[0] : '-'}</TableCell>
                                        <TableCell>{ingreso.concepto}</TableCell>
                                        <TableCell>{ingreso.chofer}</TableCell>
                                        <TableCell>{ingreso.vehiculo}</TableCell>
                                        <TableCell>{ingreso.chapa}</TableCell>
                                        {/* <TableCell>{ingreso.nro_contrato}</TableCell> */}
                                        <TableCell className="text-right font-medium">
                                            {Number(ingreso.monto).toLocaleString("es-PY", { 
                                                style: "currency", 
                                                currency: "PYG", 
                                                minimumFractionDigits: 0 
                                            })}
                                        </TableCell>
                                        <TableCell>{ingreso.forma_pago}</TableCell>
                                        {/* <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                ingreso.tipo === 'PAGO' 
                                                    ? 'bg-blue-100 text-blue-800' 
                                                    : 'bg-purple-100 text-purple-800'
                                            }`}>
                                                {ingreso.tipo}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                ingreso.estado === 'CONFIRMADO' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {ingreso.estado}
                                            </span>
                                        </TableCell> */}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>

                    <div className="flex justify-between items-center px-6 pb-4">
                        <Button
                            onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                            disabled={paginaActual === 1}
                        >
                            Anterior
                        </Button>

                        <span className="text-sm text-muted-foreground">
                            Página {paginaActual} de {totalPaginas}
                        </span>

                        <Button
                            onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                            disabled={paginaActual === totalPaginas}
                        >
                            Siguiente
                        </Button>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}