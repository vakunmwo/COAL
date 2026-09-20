<?php
declare(strict_types=1);
namespace CoalUp\CRM\Http;

final class Router {
    private array $routes=[];
    public function add(string $method,string $pattern,callable $handler,bool $auth=true,bool $csrf=false): void {
        $quoted=preg_quote(rtrim($pattern,'/') ?: '/','#');
        $regex=preg_replace('#\\\\\{([A-Za-z_][A-Za-z0-9_]*)\\\\\}#','(?P<$1>[^/]+)',$quoted);
        $this->routes[]=['method'=>strtoupper($method),'pattern'=>$pattern,'regex'=>'#^'.$regex.'$#','handler'=>$handler,'auth'=>$auth,'csrf'=>$csrf];
    }
    public function match(Request $request): array {
        foreach ($this->routes as $route) {
            if ($route['method']!==$request->method) continue;
            if (preg_match($route['regex'],$request->path,$m)) {
                $params=[]; foreach ($m as $k=>$v) if (is_string($k)) $params[$k]=$v;
                return [$route,$params];
            }
        }
        throw new ApiException(404,'route_not_found','Rota não encontrada.');
    }
}
