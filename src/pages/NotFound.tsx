import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <Card className="p-8 text-center max-w-md dark:bg-gray-800 dark:border-gray-700 transition-colors">
        <div className="flex justify-center mb-4">
          <Search className="w-16 h-16 text-gray-400 dark:text-gray-500 transition-colors" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white transition-colors">404</h1>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white transition-colors">Página não encontrada</h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 transition-colors">
          A página que você está procurando não existe ou foi movida.
        </p>

        <div className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Voltar ao início
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
            <Link to="/app">
              Ir para Dashboard
            </Link>
          </Button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 transition-colors">
          Rota: {location.pathname}
        </p>
      </Card>
    </div>
  );
};

export default NotFound;
