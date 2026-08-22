package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var appCreateCmd = &cobra.Command{
	Use:   "create [name]",
	Short: "Create an application",
	Args:  cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		name := args[0]
		image, _ := cmd.Flags().GetString("image")
		replicas, _ := cmd.Flags().GetInt("replicas")
		env, _ := cmd.Flags().GetString("environment")

		app := Application{
			Name:        name,
			Image:       image,
			Replicas:    replicas,
			Environment: env,
		}

		payload, _ := json.Marshal(app)
		apiUrl := viper.GetString("api-url")

		resp, err := http.Post(fmt.Sprintf("%s/api/v1/applications", apiUrl), "application/json", bytes.NewBuffer(payload))
		if err != nil {
			fmt.Printf("Error communicating with API: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			body, _ := io.ReadAll(resp.Body)
			fmt.Printf("API returned error: %s\n%s\n", resp.Status, string(body))
			os.Exit(1)
		}

		fmt.Printf("Application '%s' created successfully.\n", name)
	},
}

func init() {
	appCmd.AddCommand(appCreateCmd)
	appCreateCmd.Flags().StringP("image", "i", "", "Container image (required)")
	appCreateCmd.MarkFlagRequired("image")
	appCreateCmd.Flags().IntP("replicas", "r", 1, "Number of replicas")
	appCreateCmd.Flags().StringP("environment", "e", "development", "Target environment")
}
