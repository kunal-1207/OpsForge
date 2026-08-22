package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

type Application struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Image       string `json:"image"`
	Replicas    int    `json:"replicas"`
	Environment string `json:"environment"`
}

var appListCmd = &cobra.Command{
	Use:   "list",
	Short: "List applications",
	Run: func(cmd *cobra.Command, args []string) {
		outputFormat, _ := cmd.Flags().GetString("output")
		apiUrl := viper.GetString("api-url")

		resp, err := http.Get(fmt.Sprintf("%s/api/v1/applications", apiUrl))
		if err != nil {
			fmt.Printf("Error communicating with API: %v\n", err)
			os.Exit(1)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			fmt.Printf("API returned error status: %s\n", resp.Status)
			os.Exit(1)
		}

		body, _ := io.ReadAll(resp.Body)

		var apps []Application
		if err := json.Unmarshal(body, &apps); err != nil {
			fmt.Printf("Failed to parse API response: %v\n", err)
			os.Exit(1)
		}

		if outputFormat == "json" {
			fmt.Println(string(body))
			return
		}

		w := tabwriter.NewWriter(os.Stdout, 0, 0, 3, ' ', 0)
		fmt.Fprintln(w, "ID\tNAME\tIMAGE\tREPLICAS\tENVIRONMENT")
		for _, app := range apps {
			fmt.Fprintf(w, "%s\t%s\t%s\t%d\t%s\n", app.ID, app.Name, app.Image, app.Replicas, app.Environment)
		}
		w.Flush()
	},
}

func init() {
	appCmd.AddCommand(appListCmd)
	appListCmd.Flags().StringP("output", "o", "table", "Output format (table|json)")
}
