"use client";
// como utilizamos react-hook-form, debemos importar los hooks y componentes necesarios y el use cliente ya que se ejecuta del lado del cliente el hook
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
// import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from '@/components/ui/button';
import { useForm } from "react-hook-form" // para manejar el formulario
import { z } from "zod" // validacion de los datos del formulario
import { zodResolver } from "@hookform/resolvers/zod" // para integrar zod con react-hook-form
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Check, ChevronsUpDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
    Form,
    FormControl,
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

// alert
import { cn } from "@/lib/utils"




export default function FormIndex() {
    const [nuevoChofer, setNuevoChofer] = useState(false); // para saber si se va a crear un nuevo chofer o no y validar en el backend
    const [isOpen, setIsOpen] = useState(false); // para abrir y cerrar el modal
    const [opciones, setOpciones] = useState<ChoferOption[]>([]); // opciones para el select de choferes
    const [isLoading, setIsLoading] = useState(false) // para mostrar el loading en el botón de agregar vehículo

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
            .regex(/^\d+$/, "Solo se permiten números")
            .optional(),
        telefono: z.string({ required_error: "Teléfono es requerido" }).optional(),
        fechaInicio: z.string({ required_error: "Fecha de inicio es requerida" }),
        fechaFin: z.string({ required_error: "Fecha de fin es requerida" }),
        regimenPago: z.string({ required_error: "Fecha de inicio es requerida" })
    });

    type VehiculoFormData = z.infer<typeof vehiculoSchema>; // si ya se tiene uns schema de validación, se puede inferir el tipo de datos del formulario

    type ChoferOption = {
        id: string; // o `number` si tus IDs son numéricos
        nombre_completo: string;

    };
    // primero se debe instanciar el hook useForm de react-hook-form, y recibe defaultValues
    const form = useForm<VehiculoFormData>({
        resolver: zodResolver(vehiculoSchema),
        // se debe pasar el esquema de validación

    });


    //recupar los valor de la base de datos para el select de modelos
    useEffect(() => {

        fetch("/getChofer")
            .then((res) => res.json())
            .then((data) => setOpciones(data)); // llamada a la API para obtener los choferes desde el controlador de Laravel
    }, []);

    useEffect(() => {
        form.setValue("nuevoChofer", nuevoChofer);  //setear el valor de nuevoChofer en el formulario desde es useState
    }, [nuevoChofer, form]);


    // console.log(form.watch());// ver los valores del formulario en tiempo real
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
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
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
                        }

                        console.log(campo)
                        form.setError(campo as keyof VehiculoFormData, {
                            type: 'server',
                            message: mensaje,
                        });
                    });

                    toast.error("Revisá los campos requeridos.");
                } else {
                    toast.error("Error inesperado al procesar el formulario.");
                }
            },
            onFinish: () => {
                setIsLoading(false);// quitar el loading del botón

            },
        }); //enviar los datos del formulario al controlador de Laravel
    });

    // aqui se debe enviar los datos del formulario al servidor 
    return (
        <AppLayout>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Formulario de Vehículos</h1>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                {/* la puta madre que nos pario empieza */}
                <Form {...form}>  {/* se debe pasar las propiedades del form instanciado*/}
                    <form onSubmit={onSubmit} >
                        <DialogTrigger asChild>
                            <Button variant="outline">+ Agregar Vehiculo</Button>
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

                                                        {/* Para que funcione el puto combobox hay que colocar la clase pointer-events-auto y hacer todo esto
                                         
                                                        Updated all @radix-ui dependencies to their latest versions.
                                                        Updated additional dependencies relying on DismissableLayer indirectly via @radix-ui/react-dialog, such as cmdk (for combobox) and vaul (for drawer).
                                                        Removed package-lock.json and the node_modules folder.
                                                        Ran npm install to reinstall all dependencies.
                                                        */}
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
                                        <FormLabel>Inicio de Compra</FormLabel>
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
                            <Select>
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
        </AppLayout>
    )
}