using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Microprojects.Edm.Ui.Logistics.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropOrderProcessShadowFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderProcess_Order_OrderId1",
                table: "OrderProcess");

            migrationBuilder.DropIndex(
                name: "IX_OrderProcess_OrderId1",
                table: "OrderProcess");

            migrationBuilder.DropColumn(
                name: "OrderId1",
                table: "OrderProcess");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrderId1",
                table: "OrderProcess",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderProcess_OrderId1",
                table: "OrderProcess",
                column: "OrderId1");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderProcess_Order_OrderId1",
                table: "OrderProcess",
                column: "OrderId1",
                principalTable: "Order",
                principalColumn: "Id");
        }
    }
}
