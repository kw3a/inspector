package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/google/uuid"
)

type saveError struct{}

var (
	id = uuid.NewString()
)

func (so *saveError) Write(p []byte) (int, error) {
	err := sendError(string(p), id)
	if err != nil {
		fmt.Println(err)
	}
	return os.Stderr.Write(p)
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Please provide a command")
		os.Exit(1)
	}

	err := checkHealth()
	if err != nil {
		fmt.Println("Health check failed")
		os.Exit(1)
	}
	command := strings.Join(os.Args[1:], " ")

	var so saveError
	cmd := exec.Command("bash", "-c", command)
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = &so
	err = sendCommand(command, id)
	if err != nil {
		fmt.Println("Error sending command")
		os.Exit(1)
	}
	err = cmd.Run()
	if err != nil {
		fmt.Println("Error running command")
		os.Exit(1)
	}
}

func checkHealth() error {
	url := "http://localhost:3000/api/healthz"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("health check failed")
	}
	return nil
}

func sendCommand(command, commandID string) error {
	type Payload struct {
		Command string `json:"command"`
	}
	payload := Payload{Command: command}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	url := "http://localhost:3000/api/commands/" + commandID

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	fmt.Println("response status:", resp.Status)
	return nil
}

func sendError(cmdErr, commandID string) error {
	type Payload struct {
		CmdErr string `json:"cmd_err"`
	}
	payload := Payload{CmdErr: cmdErr}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	errorID := uuid.NewString()
	url := "http://localhost:3000/api/commands/" + commandID + "/" + errorID

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	fmt.Println("response status:", resp.Status)
	return nil
}
