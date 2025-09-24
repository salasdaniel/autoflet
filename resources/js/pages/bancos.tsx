"use client";
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { router } from '@inertiajs/react';
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Pencil, Trash2, Plus } from "lucide-react";

export default function BancosIndex() {
    const [bancos, setBancos] = useState<BancoOption[]>([]);
    const [entidades, setEntidades] = useState<EntidadOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bancoEditando, setBancoEditando] = useState<BancoOption | null>(null);

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina] = useState(10);
    const [filtro, setFiltro] = useState('');

    // Esquema de validación
    const bancoSchema = z.object({
        entidad_id: z.string({ required_error: "Entidad es requerida" }),
        numero_cuenta: z.string({ required_error: "Número de cuenta es requerido" }),
        moneda: z.string({ required_error: "Moneda es requerida" }),
        titular_nombre: z.string({ required_error: "Nombre del titular es requerido" }),
        titular_documento: z.string({ required_error: "Documento del titular es requerido" }),
        alias: z.string({ required_error: "Alias es requerido" }),
        tipo_alias: z.string({ required_error: "Tipo de alias es requerido" }),
    });

    type BancoFormData = z.infer<typeof bancoSchema>;

    type BancoOption = {
        id: number;
        entidad_id: number;
        entidad_nombre: string;
        numero_cuenta: string;
        moneda: string;
        titular_nombre: string;
        titular_documento: string;
        alias: string;
        tipo_alias: string;
        id_user: number;
    };

    type EntidadOption = {
        id: number;
        denominacion: string;
    };

    const form = useForm<BancoFormData>({
        resolver: zodResolver(bancoSchema),
        defaultValues: {
            entidad_id: "",
            numero_cuenta: "",
            moneda: "PYG",
            titular_nombre: "",
            titular_documento: "",
            alias: "",
            tipo_alias: "CI",
        }
    });

    // Cargar datos
    const cargarBancos = () => {
        fetch("/getBancos", { credentials: 'same-origin' })
            .then((res) => {
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    return res.json();
                }
                // If server returned HTML (likely a login redirect), throw a controlled error
                throw new Error('non-json-response');
            })
            .then((data) => setBancos(data))
            .catch((error) => {
                if (error.message === 'non-json-response') {
                    // If the user is not authenticated the server may return the login page HTML
                    // Redirect to login to start a new session
                    window.location.href = '/login';
                    return;
                }
                console.error('Error cargando bancos:', error);
            });
    };

    const cargarEntidades = () => {
        fetch("/getEntidades", { credentials: 'same-origin' })
            .then((res) => {
                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    return res.json();
                }
                throw new Error('non-json-response');
            })
            .then((data) => setEntidades(data))
            .catch((error) => {
                if (error.message === 'non-json-response') {
                    window.location.href = '/login';
                    return;
                }
                console.error('Error cargando entidades:', error);
            });
    };

    useEffect(() => {
        cargarBancos();
        cargarEntidades();
    }, []);

    // Funciones CRUD
    const handleSubmit = async (data: z.infer<typeof bancoSchema>) => {
        try {
            setIsLoading(true);
            if (bancoEditando) {
                await router.put(`/bancos/${bancoEditando.id}`, data, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsOpen(false);
                        setBancoEditando(null);
                        form.reset();
                        toast.success("Banco actualizado exitosamente");
                        // Refresh the local list using state
                        cargarBancos();
                    },
                    onError: () => {
                        toast.error("Error al actualizar el banco");
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    }
                });
            } else {
                await router.post('/bancos', data, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setIsOpen(false);
                        form.reset();
                        toast.success("Banco creado exitosamente");
                        // Refresh the local list using state
                        cargarBancos();
                    },
                    onError: () => {
                        toast.error("Error al crear el banco");
                    },
                    onFinish: () => {
                        setIsLoading(false);
                    }
                });
            }
        } catch (error) {
            console.error('Error en handleSubmit:', error);
            toast.error("Error inesperado");
            setIsLoading(false);
        }
    };

    const editarBanco = (banco: BancoOption) => {
        setBancoEditando(banco);
        form.reset({
            entidad_id: banco.entidad_id.toString(),
            numero_cuenta: banco.numero_cuenta,
            moneda: banco.moneda,
            titular_nombre: banco.titular_nombre,
            titular_documento: banco.titular_documento,
            alias: banco.alias,
            tipo_alias: banco.tipo_alias,
        });
        setIsOpen(true);
    };

    // Estado para confirmación de eliminación
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [bancoIdToDelete, setBancoIdToDelete] = useState<number | null>(null);

    const eliminarBanco = (id: number) => {
        setBancoIdToDelete(id);
        setConfirmDeleteOpen(true);
    };

    const onSubmit = (data: z.infer<typeof bancoSchema>) => {
        handleSubmit(data);
    };

    // Ejecuta la eliminación usando el id guardado en estado (llamado desde el diálogo)
    const performDelete = async () => {
        if (!bancoIdToDelete) return;
        try {
            setIsLoading(true);
            await router.delete(`/bancos/${bancoIdToDelete}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success("Banco eliminado exitosamente");
                    // Refresh the local list after deletion
                    cargarBancos();
                    // Cerrar diálogo y limpiar estado
                    setConfirmDeleteOpen(false);
                    setBancoIdToDelete(null);
                },
                onError: () => {
                    toast.error("Error al eliminar el banco");
                },
                onFinish: () => {
                    setIsLoading(false);
                }
            });
        } catch (error) {
            console.error('Error al eliminar banco:', error);
            toast.error("Error inesperado al eliminar el banco");
            setIsLoading(false);
        }
    };

    const abrirModal = () => {
        setBancoEditando(null);
        form.reset();
        setIsOpen(true);
    };

    // Filtrado
    // Ordenar por id descendente antes de filtrar/paginar
    const bancosOrdenados = [...bancos].sort((a, b) => b.id - a.id);

    const bancosFiltrados = bancosOrdenados.filter((banco) => 
        banco.entidad_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        banco.numero_cuenta.toLowerCase().includes(filtro.toLowerCase()) ||
        banco.titular_nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        banco.alias.toLowerCase().includes(filtro.toLowerCase())
    );

    // Paginación (sin cambios)
    const totalPaginas = Math.ceil(bancosFiltrados.length / itemsPorPagina);
    const bancosPaginados = bancosFiltrados.slice(
        (paginaActual - 1) * itemsPorPagina,
        paginaActual * itemsPorPagina
    );

    return (
        <AppLayout breadcrumbs={[{ title: 'Bancos', href: '/bancos' }]}>
            <Head title="Gestión de Bancos" />
            <div className="flex flex-col gap-6 p-4">
                
                {/* Header con botón agregar */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Gestión de Bancos</h1>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={abrirModal} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Agregar Banco
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {bancoEditando ? 'Editar Banco' : 'Nuevo Banco'}
                                </DialogTitle>
                                <DialogDescription>
                                    Complete los datos del banco
                                </DialogDescription>
                            </DialogHeader>
                            
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    
                                    <FormField
                                        control={form.control}
                                        name="entidad_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Entidad Bancaria</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione una entidad" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {entidades.map((entidad) => (
                                                            <SelectItem key={entidad.id} value={entidad.id.toString()}>
                                                                {entidad.denominacion}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="numero_cuenta"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Número de Cuenta</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: 1234567890" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="moneda"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Moneda</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione moneda" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="PYG">PYG - Guaraníes</SelectItem>
                                                        <SelectItem value="USD">USD - Dólares</SelectItem>
                                                        <SelectItem value="EUR">EUR - Euros</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="titular_nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre del Titular</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nombre completo" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="titular_documento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Documento del Titular</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Número de documento" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="tipo_alias"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo de Alias</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CI">CI - Cédula de Identidad</SelectItem>
                                                        <SelectItem value="TELEFONO">TELEFONO - Número de teléfono</SelectItem>
                                                        <SelectItem value="EMAIL">EMAIL - Correo electrónico</SelectItem>
                                                        <SelectItem value="PERSONALIZADO">PERSONALIZADO - Alias personalizado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="alias"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alias</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Alias para transferencias" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button variant="outline" type="button">
                                                Cancelar
                                            </Button>
                                        </DialogClose>
                                        <Button type="submit" disabled={isLoading}>
                                            {isLoading ? 'Guardando...' : bancoEditando ? 'Actualizar' : 'Crear'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                    {/* Diálogo de confirmación para eliminar */}
                    <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Eliminar Banco</DialogTitle>
                                <DialogDescription>
                                    ¿Estás seguro de que deseas eliminar este banco? Esta acción no se puede deshacer.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" onClick={() => { setConfirmDeleteOpen(false); setBancoIdToDelete(null); }}>
                                        Cancelar
                                    </Button>
                                </DialogClose>
                                <Button variant="destructive" onClick={performDelete} disabled={isLoading}>
                                    {isLoading ? 'Eliminando...' : 'Eliminar'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filtro */}
                <div className="flex gap-4 items-center">
                    <Input
                        placeholder="Buscar por entidad, cuenta, titular o alias..."
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        className="max-w-sm"
                    />
                    <Badge variant="secondary">
                        {bancosFiltrados.length} banco(s) encontrado(s)
                    </Badge>
                </div>

                {/* Lista de bancos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bancos Registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {bancosPaginados.map((banco) => (
                                <Card key={banco.id} className="border shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-semibold text-sm">{banco.entidad_nombre}</h3>
                                                <Badge variant={banco.moneda === 'PYG' ? 'default' : 'secondary'}>
                                                    {banco.moneda}
                                                </Badge>
                                            </div>
                                            
                                            <div className="text-sm text-muted-foreground">
                                                <p><strong>Cuenta:</strong> {banco.numero_cuenta}</p>
                                                <p><strong>Titular:</strong> {banco.titular_nombre}</p>
                                                <p><strong>Documento:</strong> {banco.titular_documento}</p>
                                                <p><strong>Alias:</strong> {banco.alias}</p>
                                                <p><strong>Tipo:</strong> {banco.tipo_alias}</p>
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => editarBanco(banco)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => eliminarBanco(banco.id)}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {bancosPaginados.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                {filtro ? 'No se encontraron bancos con ese filtro' : 'No hay bancos registrados'}
                            </div>
                        )}

                        {/* Paginación */}
                        {totalPaginas > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                                    disabled={paginaActual === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="flex items-center px-4">
                                    Página {paginaActual} de {totalPaginas}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                                    disabled={paginaActual === totalPaginas}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}