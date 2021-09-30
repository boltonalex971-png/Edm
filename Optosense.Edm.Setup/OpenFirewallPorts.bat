netsh advfirewall firewall add rule name="Microprojects Edm Port 16332" dir=in action=allow protocol=TCP localport=16332
rem netsh advfirewall firewall add rule name="Open Microprojects Edm Port 16332" dir=out action=allow protocol=TCP localport=16332

netsh advfirewall firewall add rule name="Microprojects Edm Port 16334" dir=in action=allow protocol=TCP localport=16334
rem netsh advfirewall firewall add rule name="Open Microprojects Edm Port 16334" dir=out action=allow protocol=TCP localport=16334
