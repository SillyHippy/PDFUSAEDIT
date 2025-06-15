
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { User } from 'lucide-react';

const physicalDescriptionSchema = z.object({
  age: z.string().optional(),
  sex: z.string().optional(),
  race: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  hair: z.string().optional(),
  beard: z.string().optional(),
  glasses: z.string().optional(),
});

export type PhysicalDescriptionData = z.infer<typeof physicalDescriptionSchema>;

interface PhysicalDescriptionFormProps {
  onSave: (data: PhysicalDescriptionData) => void;
  initialData?: PhysicalDescriptionData;
  children: React.ReactNode;
}

const PhysicalDescriptionForm: React.FC<PhysicalDescriptionFormProps> = ({
  onSave,
  initialData,
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const form = useForm<PhysicalDescriptionData>({
    resolver: zodResolver(physicalDescriptionSchema),
    defaultValues: {
      age: initialData?.age || '',
      sex: initialData?.sex || '',
      race: initialData?.race || '',
      height: initialData?.height || '',
      weight: initialData?.weight || '',
      hair: initialData?.hair || '',
      beard: initialData?.beard || '',
      glasses: initialData?.glasses || '',
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  const handleSubmit = (data: PhysicalDescriptionData) => {
    onSave(data);
    setIsOpen(false);
  };

  const handleClear = () => {
    form.reset({
      age: '',
      sex: '',
      race: '',
      height: '',
      weight: '',
      hair: '',
      beard: '',
      glasses: '',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Physical Description
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Age</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 35" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Sex</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="race"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Race</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. White" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Height</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 5'8&quot;" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Weight</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 180 lbs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hair"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Hair</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Brown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="beard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Beard</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Full">Full</SelectItem>
                          <SelectItem value="Mustache">Mustache</SelectItem>
                          <SelectItem value="Goatee">Goatee</SelectItem>
                          <SelectItem value="Stubble">Stubble</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="glasses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Glasses</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="None">None</SelectItem>
                          <SelectItem value="Prescription">Prescription</SelectItem>
                          <SelectItem value="Sunglasses">Sunglasses</SelectItem>
                          <SelectItem value="Reading">Reading</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClear}
                size="sm"
              >
                Clear All
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                size="sm"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save Description
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PhysicalDescriptionForm;
