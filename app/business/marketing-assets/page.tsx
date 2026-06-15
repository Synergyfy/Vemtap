import React from 'react';
import { useSession } from 'next-auth/react';
import { CategoryBadge } from '@/components/marketing/CategoryBadge';
import { TemplateGrid } from '@/components/marketing/TemplateGrid';
import { GenerationWizard } from '@/components/marketing/GenerationWizard';
import { MyAssetsTable } from '@/components/marketing/MyAssetsTable';
import { DownloadsTable } from '@/components/marketing/DownloadsTable';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function MarketingAssetsPage() {
  const { data: session } = useSession();
  const business = session?.user?.business;

  const [activeTab, setActiveTab] = React.useState('templates');

  return (
    <div className="p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">Marketing Assets</h1>
        <p className="text-muted-foreground">
          Create professional QR marketing materials in seconds.
        </p>
        {business && (
          <CategoryBadge category={business.category} />
        )}
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="my-assets">My Assets</TabsTrigger>
          <TabsTrigger value="downloads">Downloads</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="pt-4">
          <TemplateGrid category={business?.category} />
        </TabsContent>
        <TabsContent value="my-assets" className="pt-4">
          <MyAssetsTable />
        </TabsContent>
        <TabsContent value="downloads" className="pt-4">
          <DownloadsTable />
        </TabsContent>
      </Tabs>

      {/* Generation wizard is displayed as a modal when a template's Generate button is clicked */}
      {/* The wizard component manages its own open/close state */}
      <GenerationWizard />
    </div>
  );
}
