import React, { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { Checkbox } from "@/components/ui/checkbox";

// Interfaces
interface Contrato {
    id: number;
    fecha_inicio: string;
    fecha_fin: string | null;
    chofer: string;
    chofer_id: number;
    vehiculo: string;
    vehiculo_id: number;
    regimen_pago: string;
    monto: number;
    moneda: string;
    cantidad_pagos: number | null;
    total_pagos: number | null;
    activo: boolean;
    pagos_generados?: number;
    // Nuevos campos
    pagos_totales: number;
    pagos_pendientes: number;
    monto_total: number;
}

interface Chofer {
    id: number;
    nombre_completo: string;
}

interface Vehiculo {
    id: number;
    nombre: string;
}

interface FormData {
    fecha_inicio: string;
    fecha_fin: string;
    id_chofer: number | null;
    id_vehiculo: number | null;
    regimen_pago: string;
    monto: number | null;
    moneda: string;
    cantidad_pagos: number | null;
    activo: boolean;
}

interface PageProps {
    contratos: Contrato[];
    [key: string]: unknown;
}

const ContratosPage: React.FC = () => {
    const { props } = usePage<PageProps>();
    const { contratos } = props;

    const [formData, setFormData] = useState<FormData>({
        fecha_inicio: '',
        fecha_fin: '',
        id_chofer: null,
        id_vehiculo: null,
        regimen_pago: '',
        monto: null,
        moneda: 'PYG',
        cantidad_pagos: null,
        activo: true
    });

    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [filteredContratos, setFilteredContratos] = useState<Contrato[]>(contratos || []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnularDialogOpen, setIsAnularDialogOpen] = useState(false);
    const [contratoToAnular, setContratoToAnular] = useState<Contrato | null>(null);

    const regimenesPago = ['MENSUAL', 'QUINCENAL', 'SEMANAL', 'DIARIO'];
    const monedas = ['PYG', 'USD', 'BRL'];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (contratos) {
            setFilteredContratos(contratos);
        }
    }, [contratos]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = contratos.filter(contrato =>
                contrato.chofer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contrato.vehiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contrato.regimen_pago.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contrato.moneda.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredContratos(filtered);
        } else {
            setFilteredContratos(contratos);
        }
    }, [searchTerm, contratos]);

    const fetchData = async () => {
        try {
            const response = await fetch('/getContratosData');
            const data = await response.json();
            setChoferes(data.choferes);
            setVehiculos(data.vehiculos);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error al cargar los datos');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.fecha_inicio || !formData.id_chofer || !formData.id_vehiculo || !formData.regimen_pago || !formData.monto) {
            toast.error('Por favor complete todos los campos obligatorios');
            return;
        }

        setIsLoading(true);

        try {
            const url = isEditing ? `/contratos/${selectedContrato?.id}` : '/contratos';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setIsDialogOpen(false);
                resetForm();
                // Recargar la página para mostrar los datos actualizados
                router.reload();
            } else {
                toast.error(result.message || 'Error al procesar la solicitud');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (contrato: Contrato) => {
        setFormData({
            fecha_inicio: contrato.fecha_inicio,
            fecha_fin: contrato.fecha_fin || '',
            id_chofer: contrato.chofer_id,
            id_vehiculo: contrato.vehiculo_id,
            regimen_pago: contrato.regimen_pago,
            monto: contrato.monto,
            moneda: contrato.moneda,
            cantidad_pagos: contrato.cantidad_pagos,
            activo: contrato.activo
        });
        setSelectedContrato(contrato);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    // Abre diálogo de confirmación para anular
    const openAnularDialog = (contrato: Contrato) => {
        setContratoToAnular(contrato);
        setIsAnularDialogOpen(true);
    };

    // Llama al backend para anular el contrato y desactivar calendarios_pagos relacionados
    const handleAnular = async () => {
        if (!contratoToAnular) return;

        if (!confirm) {
            // el diálogo custom maneja la confirmación, esta línea solo por seguridad
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/contratos/${contratoToAnular.id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message || 'Contrato anulado correctamente');
                setIsAnularDialogOpen(false);
                setContratoToAnular(null);
                router.reload();
            } else {
                toast.error(result.message || 'Error al anular el contrato');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al anular el contrato');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fecha_inicio: '',
            fecha_fin: '',
            id_chofer: null,
            id_vehiculo: null,
            regimen_pago: '',
            monto: null,
            moneda: 'PYG',
            cantidad_pagos: null,
            activo: true
        });
        setSelectedContrato(null);
        setIsEditing(false);
    };

    const handleNewContrato = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: currency === 'PYG' ? 'PYG' : currency,
            minimumFractionDigits: currency === 'PYG' ? 0 : 2
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Contratos" />
            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Gestión de Contratos</h1>
                        <p className="text-muted-foreground mt-1">
                            Administra los contratos de tu flota
                        </p>
                    </div>
                    <Button onClick={handleNewContrato} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nuevo Contrato
                    </Button>
                </div>

            {/* Filtros */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Buscar por chofer, vehículo, régimen o moneda..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de contratos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Contratos ({filteredContratos.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Chofer</TableHead>
                                        <TableHead>Vehículo</TableHead>
                                        <TableHead>Fecha Inicio</TableHead>
                                        <TableHead>Fecha Fin</TableHead>
                                        <TableHead>Régimen</TableHead>
                                        <TableHead>Pagos Totales</TableHead>
                                        <TableHead>Pagos Pendientes</TableHead>
                                        <TableHead>Monto Pago</TableHead>
                                        <TableHead>Monto Total</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredContratos.map((contrato) => (
                                    <TableRow key={contrato.id}>
                                        <TableCell className="font-medium">{contrato.id}</TableCell>
                                        <TableCell className="font-medium">{contrato.chofer}</TableCell>
                                        <TableCell>{contrato.vehiculo}</TableCell>
                                        <TableCell>{contrato.fecha_inicio}</TableCell>
                                        <TableCell>{contrato.fecha_fin || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{contrato.regimen_pago}</Badge>
                                        </TableCell>
                                        {/* <TableCell>
                                            <Badge variant="secondary">{contrato.moneda}</Badge>
                                            </TableCell> */}
                                        <TableCell className="text-center">
                                            <Badge variant="outline">{contrato.pagos_totales}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={contrato.pagos_pendientes > 0 ? "destructive" : "default"}>
                                                {contrato.pagos_pendientes}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {formatCurrency(contrato.monto, contrato.moneda)}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                            {formatCurrency(contrato.monto_total, contrato.moneda)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={contrato.activo ? "default" : "destructive"}>
                                                {contrato.activo ? "Activo" : "Inactivo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(contrato)}
                                                >
                                                    Renovar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openAnularDialog(contrato)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Anular
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog para crear/editar contrato */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? 'Editar Contrato' : 'Nuevo Contrato'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                                <Input
                                    id="fecha_inicio"
                                    type="date"
                                    value={formData.fecha_inicio}
                                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                                <Input
                                    id="fecha_fin"
                                    type="date"
                                    value={formData.fecha_fin}
                                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="id_chofer">Chofer *</Label>
                                <Select
                                    value={formData.id_chofer?.toString() || ''}
                                    onValueChange={(value) => setFormData({ ...formData, id_chofer: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un chofer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {choferes.map((chofer) => (
                                            <SelectItem key={chofer.id} value={chofer.id.toString()}>
                                                {chofer.nombre_completo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="id_vehiculo">Vehículo *</Label>
                                <Select
                                    value={formData.id_vehiculo?.toString() || ''}
                                    onValueChange={(value) => setFormData({ ...formData, id_vehiculo: parseInt(value) })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione un vehículo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehiculos.map((vehiculo) => (
                                            <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                                {vehiculo.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="regimen_pago">Régimen de Pago *</Label>
                                <Select
                                    value={formData.regimen_pago}
                                    onValueChange={(value) => setFormData({ ...formData, regimen_pago: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione régimen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {regimenesPago.map((regimen) => (
                                            <SelectItem key={regimen} value={regimen}>
                                                {regimen}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="monto">Monto *</Label>
                                <Input
                                    id="monto"
                                    type="number"
                                    step="0.01"
                                    value={formData.monto || ''}
                                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || null })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="moneda">Moneda *</Label>
                                <Select
                                    value={formData.moneda}
                                    onValueChange={(value) => setFormData({ ...formData, moneda: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {monedas.map((moneda) => (
                                            <SelectItem key={moneda} value={moneda}>
                                                {moneda}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="cantidad_pagos">Cantidad de Pagos</Label>
                            <Input
                                id="cantidad_pagos"
                                type="number"
                                value={formData.cantidad_pagos || ''}
                                onChange={(e) => setFormData({ ...formData, cantidad_pagos: parseInt(e.target.value) || null })}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="activo"
                                checked={formData.activo}
                                onCheckedChange={(checked) => setFormData({ ...formData, activo: checked as boolean })}
                            />
                            <Label htmlFor="activo">Contrato activo</Label>
                        </div>

                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog para ver detalles del contrato */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalles del Contrato</DialogTitle>
                    </DialogHeader>
                    {selectedContrato && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Fecha de Inicio</Label>
                                    <p className="font-medium">{selectedContrato.fecha_inicio}</p>
                                </div>
                                <div>
                                    <Label>Fecha de Fin</Label>
                                    <p className="font-medium">{selectedContrato.fecha_fin || 'Sin definir'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Chofer</Label>
                                    <p className="font-medium">{selectedContrato.chofer}</p>
                                </div>
                                <div>
                                    <Label>Vehículo</Label>
                                    <p className="font-medium">{selectedContrato.vehiculo}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Régimen de Pago</Label>
                                    <Badge variant="outline">{selectedContrato.regimen_pago}</Badge>
                                </div>
                                <div>
                                    <Label>Monto</Label>
                                    <p className="font-medium font-mono">
                                        {formatCurrency(selectedContrato.monto, selectedContrato.moneda)}
                                    </p>
                                </div>
                                <div>
                                    <Label>Moneda</Label>
                                    <Badge variant="secondary">{selectedContrato.moneda}</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cantidad de Pagos</Label>
                                    <p className="font-medium">{selectedContrato.cantidad_pagos || 'Sin límite'}</p>
                                </div>
                                <div>
                                    <Label>Estado</Label>
                                    <Badge variant={selectedContrato.activo ? "default" : "destructive"}>
                                        {selectedContrato.activo ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Pagos Totales</Label>
                                    <p className="font-medium text-blue-600">{selectedContrato.pagos_totales}</p>
                                </div>
                                <div>
                                    <Label>Pagos Pendientes</Label>
                                    <p className={`font-medium ${selectedContrato.pagos_pendientes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {selectedContrato.pagos_pendientes}
                                    </p>
                                </div>
                                <div>
                                    <Label>Monto Total</Label>
                                    <p className="font-medium font-mono text-green-600">
                                        {formatCurrency(selectedContrato.monto_total, selectedContrato.moneda)}
                                    </p>
                                </div>
                            </div>
                            {selectedContrato.pagos_generados !== undefined && (
                                <div>
                                    <Label>Pagos Generados</Label>
                                    <p className="font-medium">{selectedContrato.pagos_generados} pagos</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsViewDialogOpen(false)}>
                            Cerrar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de confirmación para ANULAR contrato */}
            <Dialog open={isAnularDialogOpen} onOpenChange={setIsAnularDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Anulación</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p>
                            ¿Está seguro de que quiere terminar este contrato?
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Al terminar este contrato se anularán {contratoToAnular?.pagos_pendientes ?? 0} pagos pendientes.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setIsAnularDialogOpen(false); setContratoToAnular(null); }}>No</Button>
                        <Button onClick={handleAnular} disabled={isLoading}>{isLoading ? 'Procesando...' : 'Sí, anular'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </AppLayout>
    );
};

export default ContratosPage;