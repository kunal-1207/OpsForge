import requests
import argparse
import sys
from colorama import init, Fore, Style

# Initialize colorama
init(autoreset=True)

def query_prometheus(prometheus_url, query):
    """Executes a PromQL query against the Prometheus API."""
    try:
        response = requests.get(
            f"{prometheus_url}/api/v1/query",
            params={'query': query},
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        if data['status'] != 'success':
            print(f"{Fore.RED}Error: Prometheus query failed with status {data['status']}")
            return None
            
        return data['data']['result']
    except requests.exceptions.RequestException as e:
        print(f"{Fore.RED}Error connecting to Prometheus: {e}")
        return None

def check_service_health(prometheus_url):
    """Checks the health of OpsForge services."""
    print(f"\n{Style.BRIGHT}--- OpsForge Service Health ---")
    
    # Check API Service pods
    api_pods_query = 'count(kube_pod_info{namespace="default", pod=~"api-service-deployment-.*"})'
    results = query_prometheus(prometheus_url, api_pods_query)
    
    if results:
        count = int(results[0]['value'][1])
        if count > 0:
            print(f"{Fore.GREEN}API Service: {count} pods running")
        else:
            print(f"{Fore.RED}API Service: NO PODS RUNNING")
    else:
        print(f"{Fore.YELLOW}API Service: Could not retrieve metrics")

    # Check Worker Service pods
    worker_pods_query = 'count(kube_pod_info{namespace="default", pod=~"worker-service-deployment-.*"})'
    results = query_prometheus(prometheus_url, worker_pods_query)
    
    if results:
        count = int(results[0]['value'][1])
        if count > 0:
            print(f"{Fore.GREEN}Worker Service: {count} pods running")
        else:
            print(f"{Fore.RED}Worker Service: NO PODS RUNNING")
    else:
        print(f"{Fore.YELLOW}Worker Service: Could not retrieve metrics")

def check_redis_health(prometheus_url):
    """Checks Redis health metrics."""
    print(f"\n{Style.BRIGHT}--- Redis Health ---")
    
    redis_query = 'redis_up'
    results = query_prometheus(prometheus_url, redis_query)
    
    if results:
        is_up = int(results[0]['value'][1])
        if is_up == 1:
            print(f"{Fore.GREEN}Redis is UP")
        else:
            print(f"{Fore.RED}Redis is DOWN")
    else:
        print(f"{Fore.YELLOW}Redis: Could not retrieve metrics. (Make sure redis-exporter is running)")


def main():
    parser = argparse.ArgumentParser(description="OpsForge Cluster Health Checker")
    parser.add_argument(
        '--prometheus-url', 
        default='http://localhost:9090', 
        help='URL of the Prometheus server (default: http://localhost:9090)'
    )
    
    args = parser.parse_args()
    
    print(f"{Style.BRIGHT}Checking cluster health using Prometheus at {args.prometheus_url}...")
    
    check_service_health(args.prometheus_url)
    check_redis_health(args.prometheus_url)
    
    print("\nHealth check complete.")

if __name__ == "__main__":
    main()
