package main

import (
    "fmt"
    "os"
    "os/exec"
)

func detectShell() string {
    // Detectar el shell usando la variable de entorno SHELL
    shell := os.Getenv("SHELL")
    if shell == "" {
        shell = "Desconocido"
    }
    return shell
}

func main() {
    shell := detectShell()
    fmt.Printf("Detectado el shell: %s\n", shell)

    // Comando para cambiar el directorio en el shell actual
    // Nota: Esto solo genera el comando, no lo ejecuta en el shell actual.
    changeDirCommand := "cd bin"
    fmt.Printf("El comando para cambiar el directorio es: %s\n", changeDirCommand)

    // Crear un script para cambiar el directorio (para uso manual)
    scriptContent := fmt.Sprintf("#!/bin/%s\n%s", shell, changeDirCommand)
    scriptFile := "/tmp/change_dir.sh"
    err := os.WriteFile(scriptFile, []byte(scriptContent), 0755)
    if err != nil {
        fmt.Println("Error al escribir el archivo de script:", err)
        return
    }
    fmt.Printf("Script creado en %s. Puedes ejecutarlo manualmente en el shell actual.\n", scriptFile)

    // Ejecutar el script en una nueva instancia de shell (solo para demostrar)
    cmd := exec.Command(shell, "-c", changeDirCommand)
    output, err := cmd.CombinedOutput()
    if err != nil {
        fmt.Println("Error al ejecutar el comando:", err)
        return
    }
    fmt.Println("Salida del comando:", string(output))
}

