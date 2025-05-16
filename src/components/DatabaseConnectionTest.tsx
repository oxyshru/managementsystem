import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import dbService from '@/services/db.service';

const DatabaseConnectionTest = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'connected' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const { toast } = useToast();

  const testConnection = async () => {
    try {
      setStatus('loading');
      setMessage('Testing connection to MySQL database...');

      const result = await dbService.testConnection();

      if (result.success && result.data?.connected) {
        setStatus('connected');
        setMessage('Successfully connected to the MySQL database!');
        toast({
          title: 'Connection Successful',
          description: 'Connected to MySQL database',
          variant: 'default'
        });
      } else {
        setStatus('error');
        setMessage(`Connection failed: ${result.error}`);
        toast({
          title: 'Connection Failed',
          description: result.error || 'Could not connect to MySQL database',
          variant: 'destructive'
        });
      }
    } catch (error) {
      setStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`Connection error: ${errorMessage}`);
      toast({
        title: 'Connection Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {








    // Optionally test connection on component mount
    // testConnection();
  }, []);return <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Database Connection
          {status !== 'idle' && <Badge variant={status === 'loading' ? 'outline' : status === 'connected' ? 'default' : 'destructive'
          }>

              {status === 'loading' ? 'Testing...' :
          status === 'connected' ? 'Connected' :
          'Failed'}
            </Badge>
        }
        </CardTitle>
        <CardDescription>
          Test your MySQL database connection
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4" data-id="s1durlbgk" data-path="src/components/DatabaseConnectionTest.tsx">
          The database connection status will appear here after testing.
        </p>
        {message &&
      <div className={`p-3 text-sm rounded-md ${
      status === 'connected' ?
      'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' :
      status === 'error' ?
      'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' :
      'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200'}`
      } data-id="bdmlc0m3s" data-path="src/components/DatabaseConnectionTest.tsx">
            {message}
          </div>
      }
      </CardContent>
      <CardFooter>
        <Button
        onClick={testConnection}
        disabled={status === 'loading'}
        className="w-full">

          {status === 'loading' ? 'Testing Connection...' : 'Test Database Connection'}
        </Button>
      </CardFooter>
    </Card>;

};

export default DatabaseConnectionTest;