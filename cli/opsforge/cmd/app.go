package cmd

import (
	"github.com/spf13/cobra"
)

var appCmd = &cobra.Command{
	Use:   "app",
	Short: "Manage applications",
	Long:  `Create, list, describe, and delete applications on OpsForge.`,
}

func init() {
	rootCmd.AddCommand(appCmd)
}
