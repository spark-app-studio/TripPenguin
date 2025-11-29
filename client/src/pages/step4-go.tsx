import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Plane, 
  BookOpen, 
  Film, 
  Baby, 
  Lightbulb, 
  FileText, 
  Camera, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Share2, 
  Copy, 
  CheckCircle2,
  ArrowLeft,
  Download,
  Users,
  Star
} from "lucide-react";
import { PenguinLogo } from "@/components/PenguinLogo";
import { ProgressStepper } from "@/components/ProgressStepper";
import type { TripWithDetails, TripMemory, Destination } from "@shared/schema";
import { differenceInDays, format, addDays, parseISO } from "date-fns";

interface Step4GoProps {
  tripId: string;
  onBack: () => void;
}

interface WhileWaitingContent {
  books: { title: string; author: string; description: string }[];
  movies: { title: string; genre: string; description: string }[];
  kidsActivities: { activity: string; ageRange: string; description: string }[];
}

function generateWhileWaitingContent(destinations: Destination[]): WhileWaitingContent {
  const destinationNames = destinations.map(d => d.cityName).join(", ");
  const countries = [...new Set(destinations.map(d => d.countryName))];
  
  const booksData: Record<string, { title: string; author: string; description: string }[]> = {
    "France": [
      { title: "A Year in Provence", author: "Peter Mayle", description: "A charming memoir about life in southern France" },
      { title: "The Paris Wife", author: "Paula McLain", description: "Historical fiction set in 1920s Paris" },
    ],
    "Italy": [
      { title: "Under the Tuscan Sun", author: "Frances Mayes", description: "A memoir about restoring a villa in Tuscany" },
      { title: "Eat, Pray, Love", author: "Elizabeth Gilbert", description: "A journey of self-discovery including Italian adventures" },
    ],
    "Japan": [
      { title: "Memoirs of a Geisha", author: "Arthur Golden", description: "A novel set in the world of Kyoto geishas" },
      { title: "The Wind-Up Bird Chronicle", author: "Haruki Murakami", description: "A surreal journey through modern Japan" },
    ],
    "Spain": [
      { title: "The Shadow of the Wind", author: "Carlos Ruiz Zafón", description: "A gothic mystery set in Barcelona" },
      { title: "For Whom the Bell Tolls", author: "Ernest Hemingway", description: "Classic novel set during the Spanish Civil War" },
    ],
    "default": [
      { title: "A Walk in the Woods", author: "Bill Bryson", description: "Hilarious travel memoir about hiking adventures" },
      { title: "The Alchemist", author: "Paulo Coelho", description: "A tale about following your dreams" },
    ],
  };

  const moviesData: Record<string, { title: string; genre: string; description: string }[]> = {
    "France": [
      { title: "Amélie", genre: "Comedy/Romance", description: "Whimsical tale set in Montmartre, Paris" },
      { title: "Midnight in Paris", genre: "Fantasy/Comedy", description: "Woody Allen's love letter to Paris" },
    ],
    "Italy": [
      { title: "Roman Holiday", genre: "Romance", description: "Classic film featuring Rome's iconic landmarks" },
      { title: "Call Me By Your Name", genre: "Drama/Romance", description: "Beautiful summer story set in Northern Italy" },
    ],
    "Japan": [
      { title: "Lost in Translation", genre: "Drama/Comedy", description: "Two Americans finding connection in Tokyo" },
      { title: "Spirited Away", genre: "Animated/Fantasy", description: "Miyazaki's masterpiece of Japanese folklore" },
    ],
    "Spain": [
      { title: "Vicky Cristina Barcelona", genre: "Romance/Drama", description: "Romantic story set in Barcelona" },
      { title: "Pan's Labyrinth", genre: "Fantasy/Drama", description: "Dark fairy tale set in post-war Spain" },
    ],
    "default": [
      { title: "The Secret Life of Walter Mitty", genre: "Adventure/Comedy", description: "An inspiring journey around the world" },
      { title: "Up", genre: "Animated/Adventure", description: "Heartwarming Pixar film about adventure" },
    ],
  };

  const kidsActivitiesData = [
    { activity: "Create a travel journal", ageRange: "5-12", description: "Decorate a notebook for documenting the trip with drawings and stickers" },
    { activity: "Learn key phrases", ageRange: "4-10", description: `Practice saying 'hello', 'thank you', and 'please' in the local language` },
    { activity: "Map coloring activity", ageRange: "3-8", description: "Color in maps of the destinations you'll be visiting" },
    { activity: "Pack a special backpack", ageRange: "4-10", description: "Let kids choose toys, books, and activities for the plane" },
    { activity: "Watch destination videos", ageRange: "All ages", description: "Explore YouTube videos about animals, food, and culture of your destinations" },
    { activity: "Create a countdown calendar", ageRange: "3-8", description: "Cross off days until the trip with fun stickers" },
  ];

  const books = countries.flatMap(country => booksData[country] || []).slice(0, 3);
  if (books.length < 2) {
    books.push(...booksData["default"].slice(0, 2 - books.length));
  }

  const movies = countries.flatMap(country => moviesData[country] || []).slice(0, 3);
  if (movies.length < 2) {
    movies.push(...moviesData["default"].slice(0, 2 - movies.length));
  }

  return {
    books,
    movies,
    kidsActivities: kidsActivitiesData.slice(0, 4),
  };
}

const tripTips = [
  { icon: FileText, title: "Documents Ready", tip: "Make copies of passports, IDs, and confirmations. Store digitally and in your carry-on." },
  { icon: Clock, title: "Arrive Early", tip: "Get to the airport 2-3 hours before international flights. Allow buffer time for security." },
  { icon: MapPin, title: "Download Offline Maps", tip: "Save Google Maps areas for offline use. You won't always have data abroad." },
  { icon: Lightbulb, title: "Notify Your Bank", tip: "Let your bank know you're traveling to avoid card blocks on foreign transactions." },
  { icon: Users, title: "Emergency Contacts", tip: "Save local emergency numbers and your country's embassy contact information." },
  { icon: Star, title: "Travel Light", tip: "Pack versatile clothing and leave room for souvenirs. You can always buy essentials there." },
];

export default function Step4Go({ tripId, onBack }: Step4GoProps) {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [showAddPhotoDialog, setShowAddPhotoDialog] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const { data: trip, isLoading } = useQuery<TripWithDetails>({
    queryKey: ["/api/trips", tripId],
    enabled: !!tripId,
  });

  const { data: memories = [] } = useQuery<TripMemory[]>({
    queryKey: ["/api/trip-memories/trip", tripId],
    enabled: !!tripId,
  });

  const addMemoryMutation = useMutation({
    mutationFn: async (data: { tripId: string; imageUrl: string; caption?: string }) => {
      const response = await apiRequest("POST", "/api/trip-memories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-memories/trip", tripId] });
      setShowAddPhotoDialog(false);
      setNewPhotoUrl("");
      setNewPhotoCaption("");
      toast({ title: "Photo added!", description: "Your trip memory has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add photo. Please try again.", variant: "destructive" });
    },
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (memoryId: string) => {
      await apiRequest("DELETE", `/api/trip-memories/${memoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-memories/trip", tripId] });
      toast({ title: "Photo removed", description: "The photo has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove photo.", variant: "destructive" });
    },
  });

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) {
      toast({ title: "URL Required", description: "Please enter a photo URL.", variant: "destructive" });
      return;
    }
    addMemoryMutation.mutate({
      tripId,
      imageUrl: newPhotoUrl.trim(),
      caption: newPhotoCaption.trim() || undefined,
    });
  };

  const handlePrintPdf = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${trip?.title || 'Trip Itinerary'} - TripPenguin</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                h1 { color: #1a1a1a; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
                h2 { color: #333; margin-top: 30px; }
                h3 { color: #555; }
                .destination { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
                .activity { margin: 5px 0; padding: 5px 10px; background: #f5f5f5; border-radius: 4px; }
                .dates { color: #666; font-style: italic; }
                .tips { margin-top: 20px; }
                .tip { margin: 10px 0; padding: 10px; background: #fef3c7; border-radius: 4px; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const copyShareLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link Copied!", description: "Share this link with your travel companions." });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <PenguinLogo className="w-16 h-16 mx-auto animate-bounce" />
          <p className="text-muted-foreground">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Trip not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const startDate = trip.startDate ? parseISO(trip.startDate) : null;
  const daysUntilTrip = startDate ? differenceInDays(startDate, new Date()) : null;
  const destinations = trip.destinations || [];
  const whileWaitingContent = generateWhileWaitingContent(destinations);

  const tripTitle = trip.title || destinations.map(d => d.cityName).join(" → ") || "Your Adventure";

  return (
    <div className="space-y-8">
      <ProgressStepper 
        currentStep={3}
        completedSteps={[1, 2]}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-trip-title">{tripTitle}</h1>
            <p className="text-muted-foreground">Your adventure awaits!</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShareLink} data-testid="button-share">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrintPdf} data-testid="button-print-pdf">
            <Download className="w-4 h-4 mr-2" />
            Print PDF
          </Button>
        </div>
      </div>

      {/* Countdown Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-full bg-primary/20">
                <Plane className="w-8 h-8 text-primary" />
              </div>
              <div>
                {daysUntilTrip !== null && daysUntilTrip >= 0 ? (
                  <>
                    <p className="text-4xl font-bold text-primary" data-testid="text-countdown-days">{daysUntilTrip}</p>
                    <p className="text-muted-foreground">days until takeoff!</p>
                  </>
                ) : daysUntilTrip !== null && daysUntilTrip < 0 ? (
                  <>
                    <p className="text-2xl font-bold text-green-600">You're on your trip!</p>
                    <p className="text-muted-foreground">Enjoy every moment</p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold">Set your travel dates</p>
                    <p className="text-muted-foreground">Visit the itinerary page to add dates</p>
                  </>
                )}
              </div>
            </div>
            {startDate && (
              <div className="text-center md:text-right">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Departure: {format(startDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{destinations.length} destination{destinations.length !== 1 ? 's' : ''} • {trip.tripDuration} nights</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => window.location.href = '/itinerary'}
          data-testid="link-itinerary"
        >
          <MapPin className="w-6 h-6 text-primary" />
          <span>View Itinerary</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={handlePrintPdf}
          data-testid="button-download-itinerary"
        >
          <FileText className="w-6 h-6 text-primary" />
          <span>Download PDF</span>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col gap-2"
          onClick={copyShareLink}
          data-testid="button-copy-link"
        >
          <Copy className="w-6 h-6 text-primary" />
          <span>Copy Link</span>
        </Button>
        <Dialog open={showAddPhotoDialog} onOpenChange={setShowAddPhotoDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-2"
              data-testid="button-add-photo"
            >
              <Camera className="w-6 h-6 text-primary" />
              <span>Add Photo</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Trip Memory</DialogTitle>
              <DialogDescription>
                Share a photo from your trip by pasting an image URL.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Input
                  placeholder="Paste image URL (e.g., https://example.com/photo.jpg)"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  data-testid="input-photo-url"
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add a caption (optional)"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  rows={2}
                  data-testid="input-photo-caption"
                />
              </div>
              <Button 
                onClick={handleAddPhoto} 
                disabled={addMemoryMutation.isPending}
                className="w-full"
                data-testid="button-save-photo"
              >
                {addMemoryMutation.isPending ? "Saving..." : "Add Photo"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* While You Wait Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            While You Wait
          </CardTitle>
          <CardDescription>
            Fun activities to build excitement for your trip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Books */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-amber-600" />
              Recommended Reading
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {whileWaitingContent.books.map((book, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                    <p className="text-sm mt-1">{book.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Movies */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Film className="w-4 h-4 text-purple-600" />
              Movies & Shows to Watch
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {whileWaitingContent.movies.map((movie, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <h4 className="font-medium">{movie.title}</h4>
                    <Badge variant="secondary" className="text-xs mt-1">{movie.genre}</Badge>
                    <p className="text-sm mt-2">{movie.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Kids Activities */}
          {trip.numberOfTravelers > 1 && (
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Baby className="w-4 h-4 text-pink-600" />
                Fun for Kids
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {whileWaitingContent.kidsActivities.map((activity, index) => (
                  <Card key={index} className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{activity.activity}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">Ages {activity.ageRange}</Badge>
                      </div>
                      <p className="text-sm mt-1 text-muted-foreground">{activity.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Trip Tips
          </CardTitle>
          <CardDescription>
            Essential reminders for a smooth journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tripTips.map((tip, index) => (
              <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                <tip.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{tip.tip}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trip Memories / Photo Gallery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                Trip Memories
              </CardTitle>
              <CardDescription>
                Share photos from your adventure
              </CardDescription>
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowAddPhotoDialog(true)}
              data-testid="button-add-memory"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Photo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {memories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No photos yet</p>
              <p className="text-sm">Add your first memory by clicking "Add Photo" above</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {memories.map((memory) => (
                <div key={memory.id} className="relative group">
                  <img
                    src={memory.imageUrl}
                    alt={memory.caption || "Trip memory"}
                    className="w-full h-40 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x300?text=Image+Not+Found";
                    }}
                  />
                  {memory.caption && (
                    <p className="text-sm mt-2 text-muted-foreground line-clamp-2">{memory.caption}</p>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => deleteMemoryMutation.mutate(memory.id)}
                    data-testid={`button-delete-memory-${memory.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef}>
          <h1>{tripTitle}</h1>
          <p className="dates">
            {startDate && `Departure: ${format(startDate, "MMMM d, yyyy")}`}
            {trip.tripDuration && ` • ${trip.tripDuration} nights`}
          </p>
          
          <h2>Destinations</h2>
          {destinations.map((dest, index) => (
            <div key={dest.id} className="destination">
              <h3>{index + 1}. {dest.cityName}, {dest.countryName}</h3>
              <p>{dest.numberOfNights} night{dest.numberOfNights !== 1 ? 's' : ''}</p>
              {dest.arrivalDate && <p>Check-in: {dest.arrivalDate}</p>}
              {dest.departureDate && <p>Check-out: {dest.departureDate}</p>}
              {dest.activities && dest.activities.length > 0 && (
                <div>
                  <h4>Activities:</h4>
                  {dest.activities.map((activity, i) => (
                    <p key={i} className="activity">{activity}</p>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="tips">
            <h2>Trip Tips</h2>
            {tripTips.map((tip, index) => (
              <div key={index} className="tip">
                <strong>{tip.title}:</strong> {tip.tip}
              </div>
            ))}
          </div>

          <p style={{ marginTop: '40px', fontSize: '12px', color: '#666' }}>
            Generated by TripPenguin - Your debt-free travel companion
          </p>
        </div>
      </div>
    </div>
  );
}
