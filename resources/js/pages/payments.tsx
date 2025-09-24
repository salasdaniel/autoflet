"use client";
// como utilizamos react-hook-form, debemos importar los hooks y componentes necesarios y el use cliente ya que se ejecuta del lado del cliente el hook
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
    // TableFooter
} from "@/components/ui/table"
import { useEffect, useState } from 'react';
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
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Badge } from "@/components/ui/badge"
import { toast } from 'sonner';
import { useRef } from 'react';
import { Link } from '@inertiajs/react';



export default function FormIndex() {

    type paymentOption = {
        id_pago: number;
        nro_contrato: number;
        chofer: string;
        vehiculo: string;
        chapa: string;
        monto_pago: number;
        moneda: string;
        fecha_pago: string;
        fecha_cobro: string | null;
        pagado: number;
        documento_chofer: string;
        contrato_activo: number;
    };

    type paymentDetail = {
        id: number;
        id_calendario_pago: number;
        tipo_forma_pago: string;
        monto: number;
        moneda: string;
        banco_destino?: string;
        nro_comprobante?: string;
        adjunto_path?: string;
        fecha_pago: string;
        chofer: string;
        vehiculo: string;
        chapa: string;
        nro_contrato: number;
    };

    const [paymentDetails, setPaymentDetails] = useState<paymentOption[]>([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);

    // Filtros individuales
    const [filtroVehiculo, setFiltroVehiculo] = useState('');
    const [filtroChofer, setFiltroChofer] = useState('');
    const [filtroContrato, setFiltroContrato] = useState('');
    const [filtroChapa, setFiltroChapa] = useState('');
    const [filtroFechaCobro, setFiltroFechaCobro] = useState('');
    const [filtroFechaCobroHasta, setFiltroFechaCobroHasta] = useState('');
    const [filtroPagado, setFiltroPagado] = useState('0'); // Por defecto filtrar "NO pagado"

    // Ordenamiento (opcional)
    const [ordenCampo, setOrdenCampo] = useState<'id_pago' | 'nro_contrato' | 'chofer' | 'vehiculo' | 'chapa' | 'fecha_pago' | 'fecha_cobro' | 'pagado'>('id_pago');
    const [orden, setOrden] = useState<'asc' | 'desc'>('asc');
    const [totales, setTotales] = useState<totalesOption>({
        total_pagado: 0,
        total_pendiente: 0,
        pagos_cobrados: 0,
        pagos_pendientes: 0,
    });

    // Payment dialog state
    const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
    const [verPagoDialogOpen, setVerPagoDialogOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<paymentOption | null>(null);
    const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<paymentDetail | null>(null);
    const [paymentTypes, setPaymentTypes] = useState<Array<{id: number; nombre: string}>>([]);
    const [bancos, setBancos] = useState<Array<{id: number; nombre: string; entidad_nombre?: string; numero_cuenta?: string}>>([]);

    // Form fields
    const [formTipoId, setFormTipoId] = useState<number | null>(null);
    const [formMonto, setFormMonto] = useState<number | ''>('');
    const [formMoneda, setFormMoneda] = useState<string>('');
    const [formBancoDestinoId, setFormBancoDestinoId] = useState<number | null>(null);
    const [formNroComprobante, setFormNroComprobante] = useState<string>('');
    const [formAdjunto, setFormAdjunto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    type totalesOption = {
        total_pagado: number;
        total_pendiente: number;
        pagos_cobrados: number;
        pagos_pendientes: number;
    }



    const loadPayments = () => {
        fetch("/getPaymentDetails")
            .then((res) => res.json())
            .then((data) => setPaymentDetails(data));
    };

    const totalPayments = () => {
        fetch("/getTotalPayment")
            .then((res) => res.json())
            .then((data) => setTotales(data));
    };

    const loadPaymentDetail = async (idPago: number) => {
        try {
            const res = await fetch(`/getPaymentDetail/${idPago}`, { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                setSelectedPaymentDetail(data);
            }
        } catch (error) {
            console.error('Error loading payment detail:', error);
        }
    };

    useEffect(() => {
        loadPayments();
        totalPayments();
    }, []);

    // load payment types on mount
    useEffect(() => {
        fetch('/tipoFormasPago', { credentials: 'same-origin' })
            .then(res => res.json())
            .then((data) => setPaymentTypes(data))
            .catch(() => setPaymentTypes([]));
    }, []);

    // load bancos when needed (e.g., when transferencia selected)
    useEffect(() => {
        const tipo = paymentTypes.find(t => t.id === formTipoId);
        if (tipo && tipo.nombre && tipo.nombre.toUpperCase() === 'TRANSFERENCIA') {
            fetch('/getBancos', { credentials: 'same-origin' })
                .then(res => {
                    const ct = res.headers.get('content-type') || '';
                    if (!ct.includes('application/json')) return [];
                    return res.json();
                })
                .then((data) => setBancos(Array.isArray(data) ? data : []))
                .catch(() => setBancos([]));
        }
    }, [formTipoId, paymentTypes]);
    // aqui se debe enviar los datos del formulario al servidor 

    // Filtrado combinable
    const pagosFiltrados = paymentDetails.filter((p) => {
        // Filtro por fecha de cobro (rango)
        const fechaCobroValida = (() => {
            if (!p.fecha_cobro) return filtroFechaCobro === '' && filtroFechaCobroHasta === '';
            const fechaCobro = p.fecha_cobro.split('T')[0]; // Formato YYYY-MM-DD
            
            if (filtroFechaCobro && filtroFechaCobroHasta) {
                return fechaCobro >= filtroFechaCobro && fechaCobro <= filtroFechaCobroHasta;
            } else if (filtroFechaCobro) {
                return fechaCobro >= filtroFechaCobro;
            } else if (filtroFechaCobroHasta) {
                return fechaCobro <= filtroFechaCobroHasta;
            }
            return true;
        })();

        return (
            (filtroVehiculo === '' || p.vehiculo.toLowerCase().includes(filtroVehiculo.toLowerCase())) &&
            (filtroChofer === '' || p.chofer.toLowerCase().includes(filtroChofer.toLowerCase())) &&
            (filtroContrato === '' || String(p.nro_contrato).includes(filtroContrato)) &&
            (filtroChapa === '' || p.chapa.toLowerCase().includes(filtroChapa.toLowerCase())) &&
            fechaCobroValida &&
            (filtroPagado === '' || filtroPagado === 'all' || (filtroPagado === '1' ? p.pagado === true : p.pagado === false))
        );
    });

    // Ordenar
    const pagosOrdenados = [...pagosFiltrados].sort((a, b) => {
        const aVal = String(a[ordenCampo] ?? '').toLowerCase();
        const bVal = String(b[ordenCampo] ?? '').toLowerCase();
        if (aVal < bVal) return orden === 'asc' ? -1 : 1;
        if (aVal > bVal) return orden === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginación
    const totalPaginas = Math.ceil(pagosOrdenados.length / itemsPorPagina);
    const pagosPaginados = pagosOrdenados.slice(
        (paginaActual - 1) * itemsPorPagina,
        paginaActual * itemsPorPagina
    );

    // Reset página si cambian los filtros o items por página
    useEffect(() => {
        setPaginaActual(1);
    }, [filtroVehiculo, filtroChofer, filtroContrato, filtroChapa, filtroFechaCobro, filtroFechaCobroHasta, filtroPagado, itemsPorPagina]);

    const handleAdjuntoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
        setFormAdjunto(f);
    };

    const exportToExcel = () => {
        if (pagosFiltrados.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        // Preparar datos para Excel
        const dataForExcel = pagosFiltrados.map(payment => ({
            'ID Pago': payment.id_pago,
            'Contrato': payment.nro_contrato,
            'Chofer': payment.chofer,
            'Vehículo': payment.vehiculo,
            'Chapa': payment.chapa,
            'Monto': payment.monto_pago,
            'Moneda': payment.moneda,
            'Fecha Pago': payment.fecha_pago ? payment.fecha_pago.split('T')[0] : '-',
            'Fecha Cobro': payment.fecha_cobro ? payment.fecha_cobro.split('T')[0] : '-',
            'Pagado': payment.pagado ? 'SI' : 'NO'
        }));

        // Crear CSV manualmente
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

        // Descargar archivo
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pagos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Se exportaron ${dataForExcel.length} registros a Excel`);
    };

    const limpiarFiltros = () => {
        setFiltroVehiculo('');
        setFiltroChofer('');
        setFiltroContrato('');
        setFiltroChapa('');
        setFiltroFechaCobro('');
        setFiltroFechaCobroHasta('');
        setFiltroPagado('');
    };

    const handlePagoSubmit = async (e: React.FormEvent) => {
        // console.log('handlePagoSubmit invoked');
        e.preventDefault();
        if (!selectedPayment) return toast.error('No hay pago seleccionado');
        if (!formTipoId) return toast.error('Seleccione una forma de pago');
        const tipo = paymentTypes.find(t => t.id === formTipoId);
        
        // Validaciones específicas para TRANSFERENCIA
        if (tipo && tipo.nombre && tipo.nombre.toUpperCase() === 'TRANSFERENCIA') {
            if (!formBancoDestinoId) return toast.error('El banco destino es obligatorio para transferencias');
            if (!formNroComprobante.trim()) return toast.error('El número de comprobante es obligatorio para transferencias');
            if (!formAdjunto) return toast.error('El adjunto es obligatorio para transferencias');
        }

        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('id_calendario_pago', String(selectedPayment.id_pago));
            fd.append('tipo_forma_pago_id', String(formTipoId));
            fd.append('monto', String(formMonto ?? selectedPayment.monto_pago));
            fd.append('moneda', String(formMoneda ?? selectedPayment.moneda));
            if (formBancoDestinoId) fd.append('banco_destino_id', String(formBancoDestinoId));
            if (formNroComprobante) fd.append('nro_comprobante', formNroComprobante);
            if (formAdjunto) fd.append('adjunto', formAdjunto);

            // include CSRF token from meta tag if present
            const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
            const csrf = meta ? meta.content : null;

            const headers: Record<string, string> = {};
            if (csrf) {
                headers['X-CSRF-TOKEN'] = csrf;
            } else {
                // fallback: try to attach _token in FormData (some layouts put a hidden input)
                const tokenInput = document.querySelector('input[name="_token"]') as HTMLInputElement | null;
                if (tokenInput && tokenInput.value) {
                    fd.append('_token', tokenInput.value);
                }
            }

           
            const res = await fetch('/formaCobroPagos', {
                method: 'POST',
                body: fd,
                credentials: 'same-origin',
                headers,
            });

            if (!res.ok) {
                if (res.status === 419) {
                    // CSRF/session expired
                    throw new Error('Sesión expirada o CSRF inválido (419). Por favor recargue la página y vuelva a iniciar sesión.');
                }
                const text = await res.text();
                throw new Error(text || 'Error en servidor');
            }

            const json = await res.json();
            toast.success(json.message || 'Pago registrado');
            setPagoDialogOpen(false);
            setSelectedPayment(null);
            // reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
            // refresh lists
            loadPayments();
            totalPayments();
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'Error al registrar pago';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Pagos" />
            <div className="flex flex-col gap-6 p-4">

                {/* Dialog controlado para pagar */}
                <Dialog open={pagoDialogOpen} onOpenChange={(open) => { if (!open) { setPagoDialogOpen(false); setSelectedPayment(null); } }}>
                    <DialogContent className="sm:max-w-[520px]">
                        <form onSubmit={handlePagoSubmit} encType="multipart/form-data">
                            <DialogHeader>
                                <DialogTitle>Registrar Pago</DialogTitle>
                                <DialogDescription>
                                    Complete los datos del pago. Al guardar, el registro del calendario se marcará como pagado.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="text-xs text-blue-600">(UI actualizado: diálogo de pago con selección de bancos)</div>
                                <div>
                                    <Label>Forma de pago</Label>
                                    <Select value={formTipoId ? String(formTipoId) : ''} onValueChange={value => setFormTipoId(value ? Number(value) : null)}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Seleccione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentTypes.map(pt => (
                                                <SelectItem key={pt.id} value={String(pt.id)}>{pt.nombre}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Monto</Label>
                                    <Input value={String(formMonto ?? '')} readOnly className="bg-gray-50 cursor-not-allowed" />
                                </div>

                                <div>
                                    <Label>Moneda</Label>
                                    <Input value={formMoneda} readOnly className="bg-gray-50 cursor-not-allowed" />
                                </div>

                                {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() === 'TRANSFERENCIA' && (
                                    <div>
                                        <Label>Banco destino <span className="text-red-500">*</span></Label>
                                        {bancos.length === 0 ? (
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">No hay bancos registrados</span>
                                                <Link href="/bancos" className="inline-flex items-center rounded-md border px-2 py-1 text-sm hover:bg-gray-100">
                                                    +
                                                </Link>
                                            </div>
                                        ) : (
                                            <Select value={formBancoDestinoId ? String(formBancoDestinoId) : ''} onValueChange={v => setFormBancoDestinoId(v ? Number(v) : null)}>
                                                <SelectTrigger className="w-full"><SelectValue placeholder="Seleccione banco *" /></SelectTrigger>
                                                    <SelectContent>
                                                        {bancos.map(b => (
                                                            <SelectItem key={b.id} value={String(b.id)}>
                                                                {`${(b.entidad_nombre ?? b.nombre ?? '').trim()}${b.numero_cuenta ? ' - ' + b.numero_cuenta : ''}`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                )}

                                {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() !== 'EFECTIVO' && (
                                    <div>
                                        <Label>
                                            Nro. comprobante 
                                            {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() === 'TRANSFERENCIA' && <span className="text-red-500">*</span>}
                                        </Label>
                                        <Input 
                                            value={formNroComprobante} 
                                            onChange={e => setFormNroComprobante(e.target.value)}
                                            placeholder={paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() === 'TRANSFERENCIA' ? 'Ingrese el número de comprobante *' : 'Número de comprobante'}
                                        />
                                    </div>
                                )}

                                {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() !== 'EFECTIVO' && (
                                    <div>
                                        <Label>
                                            Adjuntar comprobante 
                                            {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() === 'TRANSFERENCIA' ? <span className="text-red-500">*</span> : <span className="text-gray-500">(opcional)</span>}
                                        </Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                            <input 
                                                ref={fileInputRef} 
                                                type="file" 
                                                onChange={handleAdjuntoChange}
                                                className="hidden"
                                                accept="image/*,.pdf,.doc,.docx"
                                            />
                                            <Button 
                                                type="button"
                                                variant="outline" 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mb-2"
                                            >
                                                Seleccionar archivo
                                            </Button>
                                            {formAdjunto ? (
                                                <div className="text-sm text-green-600 mt-2">
                                                    ✓ {formAdjunto.name}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 mt-2">
                                                    {paymentTypes.find(t => t.id === formTipoId)?.nombre?.toUpperCase() === 'TRANSFERENCIA' 
                                                        ? 'Archivo requerido para transferencias' 
                                                        : 'Formatos: JPG, PNG, PDF, DOC'
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" onClick={() => { setPagoDialogOpen(false); setSelectedPayment(null); }}>Cancelar</Button>
                                </DialogClose>
                                <Button type="submit" disabled={submitting} onClick={() => console.log('submit button clicked')}>
                                    {submitting ? 'Enviando...' : 'Guardar pago'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Dialog para ver detalles del pago */}
                <Dialog open={verPagoDialogOpen} onOpenChange={(open) => { if (!open) { setVerPagoDialogOpen(false); setSelectedPaymentDetail(null); } }}>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Detalles del Pago</DialogTitle>
                            <DialogDescription>
                                Información completa del pago procesado.
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPaymentDetail && (
                            <div className="grid gap-4">
                                <div>
                                    <Label>Forma de pago</Label>
                                    <Input value={selectedPaymentDetail.tipo_forma_pago || ''} readOnly className="bg-gray-50" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Monto</Label>
                                        <Input value={String(selectedPaymentDetail.monto || selectedPayment?.monto_pago || '')} readOnly className="bg-gray-50" />
                                    </div>
                                    <div>
                                        <Label>Moneda</Label>
                                        <Input value={selectedPaymentDetail.moneda || selectedPayment?.moneda || ''} readOnly className="bg-gray-50" />
                                    </div>
                                </div>

                                {selectedPaymentDetail.banco_destino && (
                                    <div>
                                        <Label>Banco destino</Label>
                                        <Input value={selectedPaymentDetail.banco_destino} readOnly className="bg-gray-50" />
                                    </div>
                                )}

                                {selectedPaymentDetail.nro_comprobante && (
                                    <div>
                                        <Label>Nro. comprobante</Label>
                                        <Input value={selectedPaymentDetail.nro_comprobante} readOnly className="bg-gray-50" />
                                    </div>
                                )}

                                <div>
                                    <Label>Fecha de pago</Label>
                                    <Input value={selectedPaymentDetail.fecha_pago ? selectedPaymentDetail.fecha_pago.split('T')[0] : ''} readOnly className="bg-gray-50" />
                                </div>

                                {selectedPaymentDetail.adjunto_path && (
                                    <div>
                                        <Label>Comprobante adjunto</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input value="Archivo adjunto disponible" readOnly className="bg-gray-50 flex-1" />
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => setImageModalOpen(true)}
                                            >
                                                Ver archivo
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" onClick={() => { setVerPagoDialogOpen(false); setSelectedPaymentDetail(null); }}>
                                    Cerrar
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal para ver imagen del comprobante */}
                <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
                    <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Comprobante de Pago</DialogTitle>
                            <DialogDescription>
                                Archivo adjunto del comprobante de pago
                            </DialogDescription>
                        </DialogHeader>
                        
                        {selectedPaymentDetail?.adjunto_path && (
                            <div className="flex justify-center items-center p-4">
                                {/* Verificar si es imagen o documento */}
                                {(selectedPaymentDetail.adjunto_path.toLowerCase().includes('.jpg') || 
                                  selectedPaymentDetail.adjunto_path.toLowerCase().includes('.jpeg') || 
                                  selectedPaymentDetail.adjunto_path.toLowerCase().includes('.png') || 
                                  selectedPaymentDetail.adjunto_path.toLowerCase().includes('.gif') || 
                                  selectedPaymentDetail.adjunto_path.toLowerCase().includes('.webp')) ? (
                                    <img 
                                        src={`/storage/${selectedPaymentDetail.adjunto_path}`}
                                        alt="Comprobante de pago"
                                        className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjx0ZXh0IHg9IjEyIiB5PSIxNiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RXJyb3I8L3RleHQ+Cjwvc3ZnPg==';
                                        }}
                                    />
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="text-6xl mb-4">📄</div>
                                        <p className="text-gray-600 mb-4">Este archivo no es una imagen</p>
                                        <Button 
                                            onClick={() => window.open(`/storage/${selectedPaymentDetail.adjunto_path}`, '_blank')}
                                            className="bg-blue-500 hover:bg-blue-600"
                                        >
                                            Descargar archivo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cerrar</Button>
                            </DialogClose>
                            {selectedPaymentDetail?.adjunto_path && (
                                <Button 
                                    onClick={() => window.open(`/storage/${selectedPaymentDetail.adjunto_path}`, '_blank')}
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    Abrir en nueva pestaña
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Card>
                    <CardHeader className="flex flex-row gap-4 justify-between items-center">
                        <CardTitle className="flex-shrink-0">Detalle de Pagos</CardTitle>

                    </CardHeader>

                    <CardContent className="grid gap-4 md:grid-cols-4 items-end">

                        <div>
                            <label className="block mb-1 font-medium">Total Cobrado</label>
                            <div className="text-xl font-bold text-green-600">
                                {Number(totales.total_pagado).toLocaleString("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Total a Cobrar</label>
                            <div className="text-xl font-bold text-green-600">
                                {Number(totales.total_pendiente).toLocaleString("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Pagos Cobrados</label>
                            <div className="text-xl font-bold text-green-600">{totales.pagos_cobrados}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Pagos Pendientes</label>
                            <div className="text-xl font-bold text-green-600">{totales.pagos_pendientes}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    {/* Empiezan los filtros */}
                    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-left gap-2 md:gap-4 px-4 py-2 flex-wrap">
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
                            <Label>Chofer</Label>
                            <Input
                                placeholder="Chofer"
                                value={filtroChofer}
                                onChange={e => setFiltroChofer(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>
                        <div>
                            <Label>Contrato</Label>
                            <Input
                                placeholder="Contrato"
                                value={filtroContrato}
                                onChange={e => setFiltroContrato(e.target.value)}
                                className="w-[100px]"
                            />
                        </div>
                        <div>
                            <Label>Chapa</Label>
                            <Input
                                placeholder="Chapa"
                                value={filtroChapa}
                                onChange={e => setFiltroChapa(e.target.value)}
                                className="w-[100px]"
                            />
                        </div>
                        <div>
                            <Label>Fecha Cobro Desde</Label>
                            <Input
                                type="date"
                                value={filtroFechaCobro}
                                onChange={e => setFiltroFechaCobro(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        <div>
                            <Label>Fecha Cobro Hasta</Label>
                            <Input
                                type="date"
                                value={filtroFechaCobroHasta}
                                onChange={e => setFiltroFechaCobroHasta(e.target.value)}
                                className="w-[150px]"
                            />
                        </div>
                        <div>
                            <Label>Pagado</Label>
                            <Select value={filtroPagado} onValueChange={setFiltroPagado}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="1">Sí</SelectItem>
                                    <SelectItem value="0">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Ordenar por</Label>
                            <Select value={ordenCampo} onValueChange={value => setOrdenCampo(value as typeof ordenCampo)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="id_pago">ID Pago</SelectItem>
                                    <SelectItem value="nro_contrato">Contrato</SelectItem>
                                    <SelectItem value="chofer">Chofer</SelectItem>
                                    <SelectItem value="vehiculo">Vehículo</SelectItem>
                                    <SelectItem value="chapa">Chapa</SelectItem>
                                    <SelectItem value="fecha_pago">Fecha Pago</SelectItem>
                                    <SelectItem value="fecha_cobro">Fecha Cobro</SelectItem>
                                    <SelectItem value="pagado">Pagado</SelectItem>
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
                    {/* terminan los filtros */}
                   
                    <CardContent className="overflow-x-auto p-6">
                        <div className="min-w-full"></div>
                        <Table>
                            <TableCaption>

                             
                                Mostrando {pagosPaginados.length} de {pagosFiltrados.length} registros
                            
                            </TableCaption>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">ID Pago</TableHead>
                                    <TableHead>Contrato</TableHead>
                                    <TableHead>Chofer</TableHead>
                                    <TableHead>Vehículo</TableHead>
                                    <TableHead>Chapa</TableHead>
                                    <TableHead>Monto</TableHead>
                                    <TableHead>Moneda</TableHead>
                                    <TableHead>Fecha Pago</TableHead>
                                    <TableHead>Fecha Cobro</TableHead>
                                    <TableHead>Pagado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pagosPaginados?.map((payment) => (
                                    <TableRow key={payment.id_pago}>
                                        <TableCell className="font-medium">{payment.id_pago}</TableCell>
                                        <TableCell>{payment.nro_contrato}</TableCell>
                                        <TableCell>{payment.chofer}</TableCell>
                                        <TableCell>{payment.vehiculo}</TableCell>
                                        <TableCell>{payment.chapa}</TableCell>
                                        <TableCell>{payment.monto_pago}</TableCell>
                                        <TableCell>{payment.moneda}</TableCell>
                                        <TableCell>{payment.fecha_pago ? payment.fecha_pago.split('T')[0] : '-'}</TableCell>
                                        <TableCell>{payment.fecha_cobro ? payment.fecha_cobro.split('T')[0] : '-'}</TableCell>
                                        <TableCell>{payment.pagado ? 'SI' : 'NO'}</TableCell>
                                        {/* Boton ver - solo mostrar si está pagado */}
                                        {payment.pagado ? (
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-500 text-white dark:bg-green-600 hover:cursor-pointer hover:bg-green-400"
                                                    onClick={async () => {
                                                        setSelectedPayment(payment);
                                                        await loadPaymentDetail(payment.id_pago);
                                                        setVerPagoDialogOpen(true);
                                                    }}
                                                >
                                                    Ver
                                                </Badge>
                                            </TableCell>
                                        ) : (
                                            <>
                                                {/* Boton pagar - solo mostrar si no está pagado */}
                                                <TableCell>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-blue-500 text-white dark:bg-blue-600 hover:cursor-pointer hover:bg-blue-400"
                                                        onClick={() => {
                                                            setSelectedPayment(payment);
                                                            setFormMonto(payment.monto_pago);
                                                            setFormMoneda(payment.moneda);
                                                            setFormTipoId(null);
                                                            setFormBancoDestinoId(null);
                                                            setFormNroComprobante('');
                                                            setFormAdjunto(null);
                                                            setPagoDialogOpen(true);
                                                        }}
                                                    >
                                                        Pagar
                                                    </Badge>
                                                </TableCell>
                                                {/* Boton anular - solo mostrar si no está pagado */}
                                                <TableCell>
                                                    <Dialog>
                                                        <form>
                                                            <DialogTrigger asChild>
                                                                <Badge
                                                                    variant="destructive"
                                                                    className='hover:cursor-pointer'
                                                                >
                                                                    Anular
                                                                </Badge>
                                                            </DialogTrigger>
                                                            <DialogContent className="sm:max-w-[425px]">
                                                                <DialogHeader>
                                                                    <DialogTitle>Edit profile</DialogTitle>
                                                                    <DialogDescription>
                                                                        Make changes to your profile here. Click save when you&apos;re
                                                                        done.
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <div className="grid gap-4">
                                                                    <div className="grid gap-3">
                                                                        <Label htmlFor="name-1">Name</Label>
                                                                        <Input id="name-1" name="name" defaultValue="Pedro Duarte" />
                                                                    </div>
                                                                    <div className="grid gap-3">
                                                                        <Label htmlFor="username-1">Username</Label>
                                                                        <Input id="username-1" name="username" defaultValue="@peduarte" />
                                                                    </div>
                                                                </div>
                                                                <DialogFooter>
                                                                    <DialogClose asChild>
                                                                        <Button variant="outline">Cancel</Button>
                                                                    </DialogClose>
                                                                    <Button type="submit">Save changes</Button>
                                                                </DialogFooter>
                                                            </DialogContent>
                                                        </form>
                                                    </Dialog>
                                                </TableCell>
                                            </>
                                        )}
                                        {/* fin botones */}

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
    )
}