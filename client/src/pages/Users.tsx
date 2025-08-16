import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { User, Shield, Mail, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import type { User as UserType } from '@shared/schema';

export default function Users() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch all users (admin only)
  const { data: users = [], isLoading, refetch } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "User list has been updated",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
        <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-orange-500/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-full">
                <User className="h-6 w-6 text-cyan-700" />
              </div>
              <div>
                <CardTitle className="text-2xl font-serif">Authenticated Users</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Users who have logged in via Replit Auth
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No users have logged in yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Users will appear here once they authenticate via Google, GitHub, X, or Apple
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {users.map((user) => (
                  <Card key={user.id} className="border-l-4 border-l-cyan-500 hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-gradient-to-br from-cyan-100 to-orange-100 rounded-full">
                            <User className="h-5 w-5 text-cyan-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {user.firstName} {user.lastName}
                              {user.id === (currentUser as any)?.id && (
                                <Badge className="ml-2 bg-green-100 text-green-800">
                                  You
                                </Badge>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Shield className="h-3 w-3 text-green-600" />
                                <span className="text-xs text-gray-500">
                                  Authenticated via Replit
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ID: {user.id.substring(0, 8)}...
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}