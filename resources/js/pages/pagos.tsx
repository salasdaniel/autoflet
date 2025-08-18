"use client";
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
// import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from 'react';

import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

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

import { Check, ChevronsUpDown } from "lucide-react"

import {
    Form,
    FormControl,
    FormDescription,
    //FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"


import { router } from '@inertiajs/react'; //para enviar los datos del formulario al servidor
import { toast } from "sonner"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,

} from "@/components/ui/command"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// alert
// import { format } from "date-fns"
// import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"






// export function DialogDemo() {
//     return (

//     )
//   }




export default function PagosIndex() {

    // logica para el formulario
    const [nuevoChofer, setNuevoChofer] = useState(false); // para saber si se va a crear un nuevo chofer o no y validar en el backend
    const [isOpen, setIsOpen] = useState(false); // para abrir y cerrar el modal
    const [opciones, setOpciones] = useState<ChoferOption[]>([]); // opciones para el select de choferes
    const [vehiculos, setVehiculos] = useState<VehiculoOption[]>([]); // opciones para el select de choferes
    const [isLoading, setIsLoading] = useState(false) // para mostrar el loading en el botón de agregar vehículo
    // const [date, setDate] = useState<Date>()
    const [regimen, setRegimen] = useState<string>("1"); // para el select de regimen de pago, por defecto es diario
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<number | null>(null);
    const [vehiculoDialogAbierto, setVehiculoDialogAbierto] = useState<number | null>(null);

    //estados para la paginacion, filtro y orden
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10); // o el valor que prefieras por defecto
    const [orden, setOrden] = useState<'asc' | 'desc'>('asc');
    const [ordenCampo, setOrdenCampo] = useState<'id' | 'nombre_completo' | 'chapa' | 'cedula'>('id');
    const [filtro, setFiltro] = useState('');
    const [filtroCampo, setFiltroCampo] = useState<'id' | 'nombre_completo' | 'chapa' | 'cedula'>('nombre_completo');

    const [totales, setTotales] = useState<totalesOption>({
        total_valorizado: 0,
        vehiculos_activos: 0,
        choferes_activos: 0,
        contratos_activos: 0,
    });
    // Filtrar
    const vehiculosFiltrados = vehiculos.filter((v) => {
        const valor = String(v[filtroCampo] ?? '').toLowerCase();
        return valor.includes(filtro.toLowerCase());
    });

    // Ordenar
    const vehiculosOrdenados = [...vehiculosFiltrados].sort((a, b) => {
        const aVal = String(a[ordenCampo] ?? '').toLowerCase();
        const bVal = String(b[ordenCampo] ?? '').toLowerCase();
        if (aVal < bVal) return orden === 'asc' ? -1 : 1;
        if (aVal > bVal) return orden === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginación
    const totalPaginas = Math.ceil(vehiculosOrdenados.length / itemsPorPagina);
    const vehiculosPaginados = vehiculosOrdenados.slice(
        (paginaActual - 1) * itemsPorPagina,
        paginaActual * itemsPorPagina
    );


    // cuonstruimos un esquema de validación con zod, para validar los datos del formulario
    const vehiculoSchema = z.object({
        chapa: z.string({ required_error: "Chapa es requerido" }),
        modelo: z.string({ required_error: "Modelo es requerido" }),
        color: z.string({ required_error: "Color es requerido" }),
        valor: z.string({ required_error: "Valor de compra es requerido" })
            .regex(/^\d+$/, "Solo se permiten números"),
        fechaCompra: z.string({ required_error: "Fecha de compra es requerida" }),
        nuevoChofer: z.boolean().optional(), // para saber si se va a crear un nuevo chofer o no
        id_chofer: z.string().optional(),
        nombre: z.string({ required_error: "Nombre es requerido" }).optional(),
        ci: z.string({ required_error: "Cédula es requerida" })
            .regex(/^\d+$/, "Solo se permiten números"),
        telefono: z.string({ required_error: "Teléfono es requerido" }).optional(),
        fechaInicio: z.string({ required_error: "Fecha de inicio es requerida" }),
        fechaFin: z.string({ required_error: "Fecha de fin es requerida" }),
        regimenPago: z.string({ required_error: "Regimen de Pago es requerido" }),
        montoContrato: z.string({ required_error: "Monto es Requerido" })
            .regex(/^\d+$/, "Solo se permiten números"),
    });

    const choferSchema = z.object({
        nuevoChofer: z.boolean(), // para saber si se va a crear un nuevo chofer o no
        id_chofer: z.string().optional(),
        nombre: z.string({ required_error: "Nombre es requerido" }).optional(),
        ci: z.string({ required_error: "Cédula es requerida" })
            .regex(/^\d+$/, "Solo se permiten números").optional(),
        telefono: z.string({ required_error: "Teléfono es requerido" }).optional(),
        id_vehiculo: z.number(),
    });

    type VehiculoFormData = z.infer<typeof vehiculoSchema>; // si ya se tiene uns schema de validación, se puede inferir el tipo de datos del formulario
    type choferFormData = z.infer<typeof choferSchema>; // si ya se tiene uns schema de validación, se puede inferir el tipo de datos del formulario

    // primero se debe instanciar el hook useForm de react-hook-form, y recibe defaultValues
    const form = useForm<VehiculoFormData>({
        resolver: zodResolver(vehiculoSchema),
        // se debe pasar el esquema de validación

    });
    const formChofer = useForm<choferFormData>({
        resolver: zodResolver(choferSchema),
        // se debe pasar el esquema de validación

    });

    type totalesOption = {
        total_valorizado: number;
        vehiculos_activos: number;
        choferes_activos: number;
        contratos_activos: number;
    }
    type ChoferOption = {
        id: string; // o `number` si tus IDs son numéricos
        nombre_completo: string;

    };


    type VehiculoOption = {
        id: number; // o `string` si tus IDs son cadenas
        chapa: string;
        modelo: string;
        color: string;
        valor: string;
        fechaCompra: string;
        nombre_completo: string; // Nombre del chofer si se crea uno nuevo
        cedula: string; // Cédula del chofer si se crea uno nuevo
    }


    //recupar los valor de la base de datos para el select de modelos
    const cargarVehiculos = () => {
        fetch("/getVehiculos")
            .then((res) => res.json())
            .then((data) => setVehiculos(data));
    };

    const cargarChoferes = () => {
        fetch("/getChofer")
            .then((res) => res.json())
            .then((data) => setOpciones(data));
    };

    const cargarTotales = () => {
        fetch("/getTotalesVehiculos")
            .then((res) => res.json())
            .then((data) => setTotales(data));
    };

    useEffect(() => {
        cargarVehiculos();
        cargarChoferes();
        console.log(cargarTotales());
    }, []);

    useEffect(() => {
        form.setValue("nuevoChofer", nuevoChofer);
        form.setValue("regimenPago", regimen);  //setear el valor de nuevoChofer y regimenPago en el formulario desde el useState
    }, [nuevoChofer, regimen, form]);

    useEffect(() => {
        formChofer.setValue("nuevoChofer", nuevoChofer);
        if (vehiculoSeleccionado !== null) {
            formChofer.setValue("id_vehiculo", vehiculoSeleccionado);
        }

    }, [nuevoChofer, vehiculoSeleccionado, formChofer]);


    console.log(formChofer.watch());// ver los valores del formulario en tiempo real
    // console.log(form.formState.errors); // ver los errores del formulario en tiempo real


    const onSubmit = form.handleSubmit((values) => {
        setIsLoading(true)
        // console.log("Datos del formulario:", values);
        // router.post('/vehiculos', values);
        router.post('/vehiculos', values, {
            onSuccess: () => {
                console.log('🚀 Éxito al guardar');
                toast.success('El vehículo fue registrado correctamente.');
                form.reset(); // reiniciar el formulario
                setIsOpen(false); // cerrar el modal
                cargarVehiculos();
                cargarChoferes();
            },
            onError: (errorResponse) => {

                console.log(typeof errorResponse);
                console.log(errorResponse);
                const rawError = errorResponse.error; // obtener el error crudo del servidor

                console.error('🚀 Error al guardar:', rawError);

                if (typeof rawError === 'string') {
                    const campos = rawError.split(',').filter(Boolean); // quita vacíos

                    campos.forEach((campo) => {
                        let mensaje = `El campo ${campo} es obligatorio.`; // o podés hacer un diccionario si querés algo más personalizado

                        if (campo === 'id_chofer') {
                            mensaje = "Debe seleccionar un chofer de la lista o crear uno nuevo.";
                        } else if (campo === 'fechaInicio' || campo === 'fechaFin') {
                            mensaje = "";
                        }

                        console.log(campo)
                        form.setError(campo as keyof VehiculoFormData, {
                            type: 'server',
                            message: mensaje,
                        });
                    });

                    toast.error("Revisá los campos requeridos. " + (errorResponse.error || ""));
                } else {
                    toast.error("Error inesperado al procesar el formulario.");
                }
            },
            onFinish: () => {
                setIsLoading(false);// quitar el loading del botón

            },
        }); //enviar los datos del formulario al controlador de Laravel
    });

    //eventos del formulario del chofer 
    const onSubmitChofer = formChofer.handleSubmit((values) => {
        setIsLoading(true)
        const datos = { ...values, id_vehiculo: vehiculoSeleccionado };
        // console.log("Datos del formulario:", values);
        // router.post('/vehiculos', values);
        router.post('/updateVehiculoChofer', datos, {
            onSuccess: () => {
                console.log('🚀 Éxito al guardar');
                toast.success('El Chofer ha sido actualizado correctamente');
                form.reset(); // reiniciar el formulario
                cargarVehiculos();
                cargarChoferes();
                setVehiculoDialogAbierto(null); // cerrar el modal

                // setTimeout(() => {
                //     window.location.reload();
                // }, 3000);
            },
            onError: (errorResponse) => {

                console.log(typeof errorResponse);
                console.log(errorResponse);
                const rawError = errorResponse.error; // obtener el error crudo del servidor

                console.error('🚀 Error al guardar:', rawError);
                console.error(errorResponse);

                if (typeof rawError === 'string') {
                    const campos = rawError.split(',').filter(Boolean); // quita vacíos

                    campos.forEach((campo) => {
                        let mensaje = `El campo ${campo} es obligatorio.`; // o podés hacer un diccionario si querés algo más personalizado

                        if (campo === 'id_chofer') {
                            mensaje = "Debe seleccionar un chofer de la lista o crear uno nuevo.";
                        } else if (campo === 'fechaInicio' || campo === 'fechaFin') {
                            mensaje = "";
                        }

                        console.log(campo)
                        form.setError(campo as keyof VehiculoFormData, {
                            type: 'server',
                            message: mensaje,
                        });
                    });

                    toast.error("Revisá los campos requeridos. " + (errorResponse.error || ""));
                } else {
                    toast.error("Error inesperado al procesar el formulario.");
                }
            },
            onFinish: () => {
                setIsLoading(false);// quitar el loading del botón

            },
        }); //enviar los datos del formulario al controlador de Laravel
    });

    // termina la logica del formulario


    return (
        <AppLayout breadcrumbs={[{ title: 'Vehiculos', href: '/pagos' }]}>
            <Head title="Pagos" />
            <div className="flex flex-col gap-6 p-4">

                <Card>
                    <CardHeader className="flex flex-row gap-4 justify-between items-center">
                        <CardTitle className="flex-shrink-0">Control de Vehiculos </CardTitle>

                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-4 items-end">
                        {/* <div>
                            <label className="block mb-1 font-medium">Fecha</label>
                           
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        data-empty={!date}
                                        className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                                    >
                                        <CalendarIcon />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={setDate} />
                                </PopoverContent>
                            </Popover>
                            
                        </div> */}
                        <div>
                            <label className="block mb-1 font-medium">Total Valorizado</label>
                            <div className="text-xl font-bold text-green-600">
                                {(Number(totales?.total_valorizado ?? 0) || 0).toLocaleString("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 })}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Vehiculos Activos</label>
                            <div className="text-xl font-bold text-green-600">{totales.vehiculos_activos}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Choferes activos</label>
                            <div className="text-xl font-bold text-green-600">{totales.choferes_activos}</div>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Contratos</label>
                            <div className="text-xl font-bold text-green-600">{totales.contratos_activos}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    {/* Empiezan los filtros */}
                    <div className="w-full flex flex-col md:flex-row md:items-center md:justify-left gap-2 md:gap-4 px-4 py-2">
                        <div>
                            <Label htmlFor="filtroCampo">Filtrar por</Label>
                            <Select value={filtroCampo} onValueChange={value => setFiltroCampo(value as 'id' | 'nombre_completo' | 'chapa' | 'cedula')}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="id">ID</SelectItem>
                                    <SelectItem value="nombre_completo">Nombre</SelectItem>
                                    <SelectItem value="chapa">Chapa</SelectItem>
                                    <SelectItem value="cedula">CI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="filtro">Buscar</Label>
                            <Input
                                id="filtro"
                                type="text"
                                placeholder="Buscar..."
                                value={filtro}
                                onChange={e => setFiltro(e.target.value)}
                                className="w-[140px]"
                            />
                        </div>
                        <div>
                            <Label htmlFor="ordenCampo">Ordenar por</Label>
                            <Select value={ordenCampo} onValueChange={value => setOrdenCampo(value as 'id' | 'nombre_completo' | 'chapa' | 'cedula')}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Campo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="id">ID</SelectItem>
                                    <SelectItem value="nombre_completo">Nombre</SelectItem>
                                    <SelectItem value="chapa">Chapa</SelectItem>
                                    <SelectItem value="cedula">CI</SelectItem>
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
                            <Label htmlFor="itemsPorPagina">Items por página</Label>
                            <Select value={String(itemsPorPagina)} onValueChange={value => setItemsPorPagina(Number(value))}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Cantidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[4, 8, 12, 16, 20].map(num => (
                                        <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* empieza el popup con el formulario */}

                        <div className="mt-6">
                            <Dialog open={isOpen} onOpenChange={setIsOpen} >
                                {/* la puta madre que nos pario empieza */}
                                <Form {...form}>  {/* se debe pasar las propiedades del form instanciado*/}
                                    <form onSubmit={onSubmit} >
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className='text-white bg-blue-500 hover:bg-blue-700 hover:text-white py-2 px-4 rounded'>+ Agregar Vehiculo</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[80vh] overflow-y-auto" >
                                            <DialogHeader>
                                                <DialogTitle>Agregar nuevo vehículo</DialogTitle>
                                                <DialogDescription>
                                                    Complete la información del vehículo y asigne un chofer
                                                </DialogDescription>
                                            </DialogHeader>
                                            <FormField name="chapa" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Chapa</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ejemplo: BNE836" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name="modelo" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Modelo</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="'Ejemplo: Hyundai i10 2020" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name="color" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Color</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Ejemplo: Blanco" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name="valor" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Valor de Compra</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Ejemplo: 75.000.000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField name="fechaCompra" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Fecha de Compra</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="date"
                                                            placeholder="YYYY-MM-DD"
                                                            value={field.value || ''}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <DialogTitle>Asignacion de chofer </DialogTitle>
                                            <div className="flex items-center gap-3">
                                                <Checkbox id="nuevoChofer" checked={nuevoChofer} onCheckedChange={() => setNuevoChofer(true)} />
                                                <Label htmlFor="nuevoChofer">Nuevo Chofer</Label>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Checkbox id="choferExistente" checked={!nuevoChofer} onCheckedChange={() => setNuevoChofer(false)} />
                                                <Label htmlFor="terms-2">Chofer Existente</Label>
                                            </div>
                                            {!nuevoChofer && (
                                                <>
                                                    <FormField
                                                        control={form.control}
                                                        name="id_chofer"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-col">
                                                                <FormLabel>Designe el Chofer</FormLabel>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <FormControl>
                                                                            <Button
                                                                                variant="outline"
                                                                                role="combobox"
                                                                                className={cn(
                                                                                    "w-[auto] justify-between",
                                                                                    !field.value && "text-muted-foreground"
                                                                                )}
                                                                            >
                                                                                {field.value
                                                                                    ? opciones.find(
                                                                                        (opt) => opt.id.toString() === field.value
                                                                                    )?.nombre_completo
                                                                                    : "Seleccione un chofer"}

                                                                                <ChevronsUpDown className="opacity-50" />
                                                                            </Button>
                                                                        </FormControl>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent
                                                                        className="w-[auto] min-w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto"
                                                                        forceMount
                                                                        style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
                                                                    >
                                                                        <Command>
                                                                            <CommandInput
                                                                                placeholder="Buscar chofer..."
                                                                                className="h-9 "
                                                                            />
                                                                            <CommandList>
                                                                                <CommandEmpty>No se encontro ningún chofer</CommandEmpty>
                                                                                <CommandGroup>
                                                                                    {opciones.map((opt) => (
                                                                                        <CommandItem
                                                                                            value={opt.id}
                                                                                            key={opt.id}
                                                                                            onSelect={() => {
                                                                                                field.onChange(opt.id.toString());
                                                                                            }}
                                                                                        >
                                                                                            {opt.nombre_completo}
                                                                                            <Check
                                                                                                className={cn(
                                                                                                    "ml-auto",
                                                                                                    field.value === opt.id.toString()
                                                                                                        ? "opacity-100"
                                                                                                        : "opacity-0"
                                                                                                )}
                                                                                            />
                                                                                        </CommandItem>
                                                                                    ))}
                                                                                </CommandGroup>
                                                                            </CommandList>
                                                                        </Command>
                                                                    </PopoverContent>
                                                                </Popover>

                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </>
                                            )}
                                            {/* la puta madre se cierra */}


                                            {nuevoChofer && (
                                                <>
                                                    <FormField name="nombre" control={form.control} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nombre Completo</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ejemplo: John Smith" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <FormField name="ci" control={form.control} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Cedula de identidad</FormLabel>
                                                            <FormControl>
                                                                <Input type="number" placeholder="Ejemplo: 9.999.999" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                    <FormField name="telefono" control={form.control} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Numero de telefono</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="Ejemplo: +595-991-663-936" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />
                                                </>
                                            )}
                                            <DialogTitle>Calendario de Pagos </DialogTitle>
                                            <div className="flex gap-4">
                                                <FormField name="fechaInicio" control={form.control} render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Inicio de Contrato</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="date"
                                                                placeholder="YYYY-MM-DD"
                                                                value={field.value || ''}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />

                                                <FormField name="fechaFin" control={form.control} render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Fin de Contrato</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                {...field}
                                                                type="date"
                                                                placeholder="YYYY-MM-DD"
                                                                value={field.value || ''}
                                                                onChange={(e) => field.onChange(e.target.value)}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="regimenPago"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Régimen de Cobro</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={(value) => {
                                                                field.onChange(value);
                                                                setRegimen(value);
                                                            }}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Regimen de Cobro" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="1">Diario</SelectItem>
                                                                <SelectItem value="2">Semanal</SelectItem>
                                                                <SelectItem value="3">Quincenal</SelectItem>
                                                                <SelectItem value="4">Mensual</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField name="montoContrato" control={form.control} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Monto de pago</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" placeholder="Ejemplo: 80.000" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>

                                            )} />
                                            <FormDescription>
                                                El monto de pago es el valor que se cobrará al chofer por el uso del vehículo segun el regiemen seleccionado.
                                            </FormDescription>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Cancel</Button>
                                                </DialogClose>

                                                <Button onClick={onSubmit} disabled={isLoading}>{isLoading ? "Procesando..." : "Agregar Vehiculo"}</Button>


                                            </DialogFooter>
                                        </DialogContent>
                                    </form>
                                </Form>
                                {/* la puta madre que nos pario termina */}
                            </Dialog>
                        </div>
                        {/* termina el popup con el formulario */}
                    </div>
                    {/* terminan los filtros */}
                    <CardHeader>
                        <CardTitle>Listado de Vehiculos</CardTitle>
                        <p className="text-sm text-muted-foreground">Para ver los pagos, darle click al boton  "Ver Pagos" </p>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-4">
                        {vehiculosPaginados.map((v) => (
                            <Card key={v.id} className="border shadow-sm">
                                <CardHeader className="flex flex-col gap-1">

                                    <CardTitle className="text-base">
                                        {v.id}-{v.modelo}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">{v.chapa} <Badge variant="outline">{v.color}</Badge></p>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <div>
                                        <p className="font-medium text-sm">{v.nombre_completo}</p>
                                        <p className="text-xs text-muted-foreground">CI: {v.cedula}</p>


                                        <Dialog open={vehiculoDialogAbierto === v.id}
                                            onOpenChange={(open) => {
                                                setVehiculoDialogAbierto(open ? v.id : null);
                                                if (open) setVehiculoSeleccionado(v.id);
                                            }}>
                                            {/* la puta madre que nos pario empieza */}
                                            <Form {...formChofer}>  {/* se debe pasar las propiedades del form instanciado*/}
                                                <form onSubmit={onSubmitChofer} >
                                                    <DialogTrigger asChild>
                                                        <Badge variant="destructive" className='hover:cursor-pointer'>Cambiar Chofer</Badge>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-h-[80vh] overflow-y-auto" >
                                                        <DialogHeader>
                                                            <DialogTitle>Cambiar el chofer asignado</DialogTitle>
                                                            <DialogDescription>
                                                                asigne un nuevo chofer al vehículo o cree un nuevo chofer
                                                            </DialogDescription>
                                                        </DialogHeader>

                                                        <div className="flex items-center gap-3">
                                                            <Checkbox id="nuevoChofer" checked={nuevoChofer} onCheckedChange={() => setNuevoChofer(true)} />
                                                            <Label htmlFor="nuevoChofer">Nuevo Chofer</Label>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox id="choferExistente" checked={!nuevoChofer} onCheckedChange={() => setNuevoChofer(false)} />
                                                            <Label htmlFor="terms-2">Chofer Existente</Label>
                                                        </div>
                                                        {!nuevoChofer && (
                                                            <>
                                                                <FormField
                                                                    control={formChofer.control}
                                                                    name="id_chofer"
                                                                    render={({ field }) => (
                                                                        <FormItem className="flex flex-col">
                                                                            <FormLabel>Designe el Chofer</FormLabel>
                                                                            <Popover>
                                                                                <PopoverTrigger asChild>
                                                                                    <FormControl>
                                                                                        <Button
                                                                                            variant="outline"
                                                                                            role="combobox"
                                                                                            className={cn(
                                                                                                "w-[auto] justify-between",
                                                                                                !field.value && "text-muted-foreground"
                                                                                            )}
                                                                                        >
                                                                                            {field.value
                                                                                                ? opciones.find(
                                                                                                    (opt) => opt.id.toString() === field.value
                                                                                                )?.nombre_completo
                                                                                                : "Seleccione un chofer"}

                                                                                            <ChevronsUpDown className="opacity-50" />
                                                                                        </Button>
                                                                                    </FormControl>
                                                                                </PopoverTrigger>
                                                                                <PopoverContent
                                                                                    className="w-[auto] min-w-[var(--radix-popover-trigger-width)] p-0 pointer-events-auto"
                                                                                    forceMount
                                                                                    style={{ minWidth: 'var(--radix-popover-trigger-width)' }}
                                                                                >
                                                                                    <Command>
                                                                                        <CommandInput
                                                                                            placeholder="Buscar chofer..."
                                                                                            className="h-9 "
                                                                                        />
                                                                                        <CommandList>
                                                                                            <CommandEmpty>No se encontro ningún chofer</CommandEmpty>
                                                                                            <CommandGroup>
                                                                                                {opciones.map((opt) => (
                                                                                                    <CommandItem
                                                                                                        value={opt.id}
                                                                                                        key={opt.id}
                                                                                                        onSelect={() => {
                                                                                                            field.onChange(opt.id.toString());
                                                                                                        }}
                                                                                                    >
                                                                                                        {opt.nombre_completo}
                                                                                                        <Check
                                                                                                            className={cn(
                                                                                                                "ml-auto",
                                                                                                                field.value === opt.id.toString()
                                                                                                                    ? "opacity-100"
                                                                                                                    : "opacity-0"
                                                                                                            )}
                                                                                                        />
                                                                                                    </CommandItem>
                                                                                                ))}
                                                                                            </CommandGroup>
                                                                                        </CommandList>
                                                                                    </Command>
                                                                                </PopoverContent>
                                                                            </Popover>

                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    )}
                                                                />
                                                            </>
                                                        )}
                                                        {/* la puta madre se cierra */}


                                                        {nuevoChofer && (
                                                            <>
                                                                <FormField name="nombre" control={formChofer.control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Nombre Completo</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Ejemplo: John Smith" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField name="ci" control={formChofer.control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Cedula de identidad</FormLabel>
                                                                        <FormControl>
                                                                            <Input type="number" placeholder="Ejemplo: 9.999.999" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                                <FormField name="telefono" control={formChofer.control} render={({ field }) => (
                                                                    <FormItem>
                                                                        <FormLabel>Numero de telefono</FormLabel>
                                                                        <FormControl>
                                                                            <Input placeholder="Ejemplo: +595-991-663-936" {...field} />
                                                                        </FormControl>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                )} />
                                                            </>
                                                        )}
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="outline">Cancel</Button>
                                                            </DialogClose>

                                                            <Button onClick={onSubmitChofer} disabled={isLoading}>{isLoading ? "Procesando..." : "Cambiar"}</Button>


                                                        </DialogFooter>
                                                    </DialogContent>
                                                </form>
                                            </Form>
                                            {/* la puta madre que nos pario termina */}
                                        </Dialog>
                                        <br />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className='text-white bg-blue-500 hover:bg-blue-700 hover:text-white py-2 px-4 rounded w-full hover:cursor-pointer' size="sm">Ver Pagos</Button>
                                        {/* <Button variant="destructive" size="sm" className="w-full">No Pagó</Button> */}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </CardContent>
                    <CardFooter className="flex justify-center gap-2 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                            disabled={paginaActual === 1}
                        >
                            Anterior
                        </Button>
                        <span className="flex items-center px-2 text-sm text-muted-foreground">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                            disabled={paginaActual === totalPaginas || totalPaginas === 0}
                        >
                            Siguiente
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    );
}
