"use client";

import * as React from "react";
import {
  Bell,
  Bold,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  Info,
  Italic,
  Mail,
  Settings,
  Star,
  Trash2,
  Triangle,
  Underline,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Section, Demo } from "./section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Kbd } from "@/components/ui/kbd";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const TOKENS: Array<{ name: string; varName: string }> = [
  { name: "background", varName: "--background" },
  { name: "foreground", varName: "--foreground" },
  { name: "muted", varName: "--muted" },
  { name: "muted-foreground", varName: "--muted-foreground" },
  { name: "primary", varName: "--primary" },
  { name: "secondary", varName: "--secondary" },
  { name: "accent", varName: "--accent" },
  { name: "destructive", varName: "--destructive" },
  { name: "success", varName: "--success" },
  { name: "warning", varName: "--warning" },
  { name: "info", varName: "--info" },
  { name: "border", varName: "--border" },
];

export function ShowcaseClient() {
  const [progress, setProgress] = React.useState(34);
  const [sliderValue, setSliderValue] = React.useState([40]);
  const [showBookmarks, setShowBookmarks] = React.useState(true);
  const [textFormat, setTextFormat] = React.useState<string[]>(["bold"]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 100 ? 20 : p + 6));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-14">
      {/* TOKENS */}
      <Section
        title="Tokens"
        description="Semantic CSS variables. Use these via Tailwind utilities like bg-primary, text-muted-foreground."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {TOKENS.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div
                className="size-10 shrink-0 rounded-md border"
                style={{ background: `var(${t.varName})` }}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{t.name}</p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {t.varName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section
        title="Typography"
        description="Geist Sans for UI, Geist Mono for code. Tailwind text-* utilities."
      >
        <Demo>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight">Display heading</h1>
            <h2 className="text-2xl font-semibold tracking-tight">Section heading</h2>
            <h3 className="text-lg font-semibold">Subsection heading</h3>
            <p className="text-base leading-relaxed">
              Body copy. The quick brown fox jumps over the lazy dog.
            </p>
            <p className="text-sm text-muted-foreground">
              Muted secondary text for descriptions and helper copy.
            </p>
            <p className="font-mono text-sm">const greeting = &quot;hello world&quot;;</p>
          </div>
        </Demo>
      </Section>

      {/* BUTTONS */}
      <Section title="Button" description="Variants and sizes.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Variants">
            <div className="flex flex-wrap items-center gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </Demo>
          <Demo label="Sizes & states">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" aria-label="Settings">
                <Settings />
              </Button>
              <Button disabled>Disabled</Button>
              <Button variant="outline">
                <Mail /> With icon
              </Button>
            </div>
          </Demo>
        </div>
      </Section>

      {/* BADGES */}
      <Section title="Badge" description="Tag-style status indicators.">
        <Demo>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">
              <CheckCircle2 /> Success
            </Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
          </div>
        </Demo>
      </Section>

      {/* INPUTS */}
      <Section title="Form fields" description="Inputs, textarea, label, kbd hint.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Text input">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" />
              <p className="text-xs text-muted-foreground">
                We will never share your email.
              </p>
            </div>
          </Demo>
          <Demo label="Invalid state">
            <div className="space-y-2">
              <Label htmlFor="bad">Username</Label>
              <Input id="bad" aria-invalid defaultValue="admin" />
              <p className="text-xs text-destructive">Already taken.</p>
            </div>
          </Demo>
          <Demo label="Textarea">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Type a few lines and watch it grow."
              />
            </div>
          </Demo>
          <Demo label="Keyboard hint">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              Open the command palette with <Kbd>⌘</Kbd> <Kbd>K</Kbd>.
            </p>
          </Demo>
        </div>
      </Section>

      {/* SELECTION */}
      <Section
        title="Selection controls"
        description="Checkbox, radio, switch, slider — all keyboard-accessible."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Checkbox">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" defaultChecked />
                <Label htmlFor="terms">Accept terms and conditions</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="news" />
                <Label htmlFor="news">Subscribe to newsletter</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="indet" checked="indeterminate" />
                <Label htmlFor="indet">Indeterminate state</Label>
              </div>
            </div>
          </Demo>
          <Demo label="Radio group">
            <RadioGroup defaultValue="comfortable">
              {["default", "comfortable", "compact"].map((v) => (
                <div className="flex items-center gap-2" key={v}>
                  <RadioGroupItem value={v} id={`r-${v}`} />
                  <Label htmlFor={`r-${v}`} className="capitalize">{v}</Label>
                </div>
              ))}
            </RadioGroup>
          </Demo>
          <Demo label="Switch">
            <div className="flex items-center gap-2">
              <Switch id="airplane" />
              <Label htmlFor="airplane">Airplane mode</Label>
            </div>
          </Demo>
          <Demo label="Slider">
            <div className="space-y-3">
              <Slider
                value={sliderValue}
                onValueChange={setSliderValue}
                max={100}
                step={1}
              />
              <p className="text-sm text-muted-foreground">
                Value: <span className="text-foreground">{sliderValue[0]}</span>
              </p>
            </div>
          </Demo>
        </div>
      </Section>

      {/* PROGRESS / SKELETON */}
      <Section title="Feedback" description="Progress indicators and loading skeletons.">
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Progress (auto-incrementing)">
            <div className="space-y-3">
              <Progress value={progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
            </div>
          </Demo>
          <Demo label="Skeleton">
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Demo>
        </div>
      </Section>

      {/* TOGGLES */}
      <Section
        title="Toggles"
        description="Single Toggle and grouped ToggleGroup."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Toggle">
            <div className="flex items-center gap-2">
              <Toggle aria-label="Toggle bold">
                <Bold />
              </Toggle>
              <Toggle aria-label="Toggle italic" variant="outline">
                <Italic />
              </Toggle>
            </div>
          </Demo>
          <Demo label="ToggleGroup (multiple)">
            <ToggleGroup
              type="multiple"
              value={textFormat}
              onValueChange={setTextFormat}
              aria-label="Text formatting"
            >
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <Underline />
              </ToggleGroupItem>
            </ToggleGroup>
          </Demo>
        </div>
      </Section>

      {/* AVATARS / SEPARATOR / ASPECT RATIO */}
      <Section
        title="Media & layout"
        description="Avatar, Separator, AspectRatio, ScrollArea."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Avatar">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>SC</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>
                  <User className="size-5" />
                </AvatarFallback>
              </Avatar>
              <Avatar className="size-12">
                <AvatarFallback>ZB</AvatarFallback>
              </Avatar>
            </div>
          </Demo>
          <Demo label="Separator">
            <div className="flex h-16 items-center gap-4 text-sm">
              <span>Item A</span>
              <Separator orientation="vertical" />
              <span>Item B</span>
              <Separator orientation="vertical" />
              <span>Item C</span>
            </div>
            <Separator className="mt-4" />
          </Demo>
          <Demo label="AspectRatio">
            <AspectRatio
              ratio={16 / 9}
              className="overflow-hidden rounded-lg border bg-gradient-to-br from-primary/20 via-info/20 to-success/20"
            >
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                16 / 9 placeholder
              </div>
            </AspectRatio>
          </Demo>
          <Demo label="ScrollArea">
            <ScrollArea className="h-32 rounded-md border">
              <div className="space-y-1 p-3">
                {Array.from({ length: 24 }).map((_, i) => (
                  <p key={i} className="text-sm">
                    Item #{i + 1}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </Demo>
        </div>
      </Section>

      {/* CARD */}
      <Section title="Card" description="Composable container.">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Project setup</CardTitle>
            <CardDescription>
              Token-driven design system with Radix Primitives.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Drop these components into any hackathon idea — the tokens adapt to
              whatever theme the project ends up needing.
            </p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button>Get started</Button>
            <Button variant="outline">Docs</Button>
          </CardFooter>
        </Card>
      </Section>

      {/* TABS / ACCORDION / COLLAPSIBLE */}
      <Section
        title="Disclosure"
        description="Tabs, Accordion, Collapsible."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Tabs">
            <Tabs defaultValue="account" className="w-full">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="api">API keys</TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="text-sm text-muted-foreground">
                Edit your account profile, email, and avatar.
              </TabsContent>
              <TabsContent value="password" className="text-sm text-muted-foreground">
                Change your password and review active sessions.
              </TabsContent>
              <TabsContent value="api" className="text-sm text-muted-foreground">
                Rotate API keys and manage scopes.
              </TabsContent>
            </Tabs>
          </Demo>
          <Demo label="Accordion">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="a">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>
                  Yes — built on Radix Primitives which handle keyboard nav and ARIA.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>Is it themed?</AccordionTrigger>
                <AccordionContent>
                  All components consume CSS variables; dark mode is class-driven.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c" className="border-b-0">
                <AccordionTrigger>Can I extend it?</AccordionTrigger>
                <AccordionContent>
                  Yes — every component is local source you can edit.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Demo>
          <Demo label="Collapsible" className="md:col-span-2">
            <Collapsible className="space-y-2">
              <div className="flex items-center justify-between gap-4 rounded-md border px-4 py-2">
                <p className="text-sm font-medium">@user starred 3 repositories</p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Toggle
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                {["radix-ui/primitives", "vercel/next.js", "tailwindlabs/tailwindcss"].map(
                  (repo) => (
                    <div
                      key={repo}
                      className="flex items-center gap-2 rounded-md border bg-muted/30 px-4 py-2 text-sm"
                    >
                      <Star className="size-3.5 text-warning" />
                      {repo}
                    </div>
                  ),
                )}
              </CollapsibleContent>
            </Collapsible>
          </Demo>
        </div>
      </Section>

      {/* OVERLAYS: tooltip / popover / hover card / dialog / alert-dialog / dropdown / context / select */}
      <Section
        title="Overlays"
        description="Tooltip, Popover, HoverCard, Dialog, AlertDialog, DropdownMenu, ContextMenu, Select."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Demo label="Tooltip">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Copy">
                    <Copy />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Delete">
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Delete permanently</TooltipContent>
              </Tooltip>
            </div>
          </Demo>

          <Demo label="Popover">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Edit dimensions</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Dimensions</p>
                    <p className="text-xs text-muted-foreground">
                      Set the dimensions for the layer.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="width" className="col-span-1">Width</Label>
                    <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label htmlFor="max" className="col-span-1">Max</Label>
                    <Input id="max" defaultValue="300px" className="col-span-2 h-8" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </Demo>

          <Demo label="Hover card">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link" className="px-0">@radix-ui</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>RX</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Radix UI</p>
                    <p className="text-xs text-muted-foreground">
                      Unstyled, accessible components.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </Demo>

          <Demo label="Dialog">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Update your display name. Click save when you&apos;re done.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue="Zafer Bozkurt" />
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={() => setOpen(false)}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Demo>

          <Demo label="Alert dialog">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and remove your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Demo>

          <Demo label="Dropdown menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Open menu <ChevronRight className="rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User /> Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings /> Settings
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuCheckboxItem
                  checked={showBookmarks}
                  onCheckedChange={setShowBookmarks}
                >
                  Show bookmarks
                </DropdownMenuCheckboxItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Mail /> Invite users
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Email</DropdownMenuItem>
                    <DropdownMenuItem>Slack</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Demo>

          <Demo label="Context menu (right-click area)">
            <ContextMenu>
              <ContextMenuTrigger className="flex h-24 items-center justify-center rounded-md border-2 border-dashed text-sm text-muted-foreground">
                Right click here
              </ContextMenuTrigger>
              <ContextMenuContent className="w-52">
                <ContextMenuItem>
                  <ChevronLeft /> Back
                  <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem>
                  <ChevronRight /> Forward
                  <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <Copy /> Copy
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Demo>

          <Demo label="Select">
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select defaultValue="next">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Meta-frameworks</SelectLabel>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectItem value="remix">Remix</SelectItem>
                    <SelectItem value="astro">Astro</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Libraries</SelectLabel>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="vue">Vue</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Demo>
        </div>
      </Section>

      {/* ALERTS */}
      <Section title="Alert" description="Status messages.">
        <div className="grid gap-3 md:grid-cols-2">
          <Alert>
            <Info />
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>
              You can use a generic alert for any notice.
            </AlertDescription>
          </Alert>
          <Alert variant="info">
            <Info />
            <AlertTitle>FYI</AlertTitle>
            <AlertDescription>
              Documentation is included in the README.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2 />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>Your changes were saved.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <Triangle />
            <AlertTitle>Careful</AlertTitle>
            <AlertDescription>This action cannot be undone.</AlertDescription>
          </Alert>
          <Alert variant="destructive" className="md:col-span-2">
            <Bell />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>
              Please retry, or contact support if the problem persists.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* TOAST */}
      <Section
        title="Toast"
        description="Triggered from anywhere via Sonner. Picks up the active theme."
      >
        <Demo>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast("Event has been created.")}>
              Default toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.success("Profile saved", {
                  description: "Your changes are live.",
                })
              }
            >
              Success
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Failed to publish", {
                  description: "Network error. Try again.",
                  action: { label: "Retry", onClick: () => toast("Retrying…") },
                })
              }
            >
              Error
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                toast.promise(
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                  {
                    loading: "Deploying…",
                    success: "Deployment ready",
                    error: "Deployment failed",
                  },
                )
              }
            >
              Promise
            </Button>
          </div>
        </Demo>
      </Section>

      <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-1">
          Built with <Heart className="inline size-3.5 text-destructive" /> on Radix
          Primitives & Tailwind v4.
        </p>
      </footer>
    </div>
  );
}
