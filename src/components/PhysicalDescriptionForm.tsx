
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
  ethnicity: z.string().optional(),
  height_feet: z.string().optional(),
  height_inches: z.string().optional(),
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
      ethnicity: initialData?.ethnicity || '',
      height_feet: initialData?.height_feet || '',
      height_inches: initialData?.height_inches || '',
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
      ethnicity: '',
      height_feet: '',
      height_inches: '',
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

            <FormField
              control={form.control}
              name="ethnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">Ethnicity</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="African American">African American</SelectItem>
                        <SelectItem value="Asian American">Asian American</SelectItem>
                        <SelectItem value="Caucasian">Caucasian</SelectItem>
                        <SelectItem value="Hispanic">Hispanic</SelectItem>
                        <SelectItem value="Latino">Latino</SelectItem>
                        <SelectItem value="Middle Eastern">Middle Eastern</SelectItem>
                        <SelectItem value="Native American">Native American</SelectItem>
                        <SelectItem value="Native Hawaiian">Native Hawaiian</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="height_feet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Height (Feet)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Feet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3'</SelectItem>
                          <SelectItem value="4">4'</SelectItem>
                          <SelectItem value="5">5'</SelectItem>
                          <SelectItem value="6">6'</SelectItem>
                          <SelectItem value="7">7'</SelectItem>
                          <SelectItem value="8">8'</SelectItem>
                          <SelectItem value="9">9'</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height_inches"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Height (Inches)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Inches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0"</SelectItem>
                          <SelectItem value="1">1"</SelectItem>
                          <SelectItem value="2">2"</SelectItem>
                          <SelectItem value="3">3"</SelectItem>
                          <SelectItem value="4">4"</SelectItem>
                          <SelectItem value="5">5"</SelectItem>
                          <SelectItem value="6">6"</SelectItem>
                          <SelectItem value="7">7"</SelectItem>
                          <SelectItem value="8">8"</SelectItem>
                          <SelectItem value="9">9"</SelectItem>
                          <SelectItem value="10">10"</SelectItem>
                          <SelectItem value="11">11"</SelectItem>
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
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
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
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
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
