import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, X } from "lucide-react";

interface AddSiteFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AddSiteForm({ onSuccess, onCancel }: AddSiteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    status: 'Completed',
    name: '',
    addrLine1: '',
    addrLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    acreage: '',
    unitsTotal: '',
    units1b: '',
    units2b: '',
    units3b: '',
    avgSf: '',
    completionYear: '',
    parkingSpaces: '',
    sourceUrl: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Site name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        ...formData,
        // Convert empty strings to null and parse numbers
        acreage: formData.acreage ? parseFloat(formData.acreage) : null,
        unitsTotal: formData.unitsTotal ? parseInt(formData.unitsTotal) : null,
        units1b: formData.units1b ? parseInt(formData.units1b) : null,
        units2b: formData.units2b ? parseInt(formData.units2b) : null,
        units3b: formData.units3b ? parseInt(formData.units3b) : null,
        avgSf: formData.avgSf ? parseFloat(formData.avgSf) : null,
        completionYear: formData.completionYear ? parseInt(formData.completionYear) : null,
        parkingSpaces: formData.parkingSpaces ? parseInt(formData.parkingSpaces) : null,
      };

      // Remove empty string fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });

      await apiRequest('/api/sites', {
        method: 'POST',
        body: submitData
      });

      toast({
        title: "Site Added",
        description: `${formData.name} has been added successfully`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: "Failed to Add Site",
        description: "There was an error creating the site",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Status and Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Newest">Newest</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pipeline">Pipeline</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Site Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter site name"
              required
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addrLine1">Address Line 1</Label>
            <Input
              id="addrLine1"
              value={formData.addrLine1}
              onChange={(e) => handleChange('addrLine1', e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="addrLine2">Address Line 2</Label>
            <Input
              id="addrLine2"
              value={formData.addrLine2}
              onChange={(e) => handleChange('addrLine2', e.target.value)}
              placeholder="Apartment, suite, unit, building, floor, etc."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">ZIP Code</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="ZIP Code"
              />
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="space-y-4">
          <h3 className="font-cinzel font-semibold text-brand-ink">Property Details</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="acreage">Acreage</Label>
              <Input
                id="acreage"
                type="number"
                step="0.1"
                value={formData.acreage}
                onChange={(e) => handleChange('acreage', e.target.value)}
                placeholder="Site acreage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitsTotal">Total Units</Label>
              <Input
                id="unitsTotal"
                type="number"
                value={formData.unitsTotal}
                onChange={(e) => handleChange('unitsTotal', e.target.value)}
                placeholder="Total unit count"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="units1b">1 Bedroom</Label>
              <Input
                id="units1b"
                type="number"
                value={formData.units1b}
                onChange={(e) => handleChange('units1b', e.target.value)}
                placeholder="1BR units"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units2b">2 Bedroom</Label>
              <Input
                id="units2b"
                type="number"
                value={formData.units2b}
                onChange={(e) => handleChange('units2b', e.target.value)}
                placeholder="2BR units"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="units3b">3 Bedroom</Label>
              <Input
                id="units3b"
                type="number"
                value={formData.units3b}
                onChange={(e) => handleChange('units3b', e.target.value)}
                placeholder="3BR units"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avgSf">Average Sq Ft</Label>
              <Input
                id="avgSf"
                type="number"
                value={formData.avgSf}
                onChange={(e) => handleChange('avgSf', e.target.value)}
                placeholder="Average square footage"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="completionYear">Completion Year</Label>
              <Input
                id="completionYear"
                type="number"
                value={formData.completionYear}
                onChange={(e) => handleChange('completionYear', e.target.value)}
                placeholder="Year completed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingSpaces">Parking Spaces</Label>
              <Input
                id="parkingSpaces"
                type="number"
                value={formData.parkingSpaces}
                onChange={(e) => handleChange('parkingSpaces', e.target.value)}
                placeholder="Number of parking spaces"
              />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source URL</Label>
            <Input
              id="sourceUrl"
              type="url"
              value={formData.sourceUrl}
              onChange={(e) => handleChange('sourceUrl', e.target.value)}
              placeholder="https://www.bristoldevelopment.com/project"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about this site"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-3 pt-6 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-maroon hover:bg-brand-maroon/90"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding Site...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Add Site
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}